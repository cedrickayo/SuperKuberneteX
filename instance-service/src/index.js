const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;
const INSTANCE_NAME = process.env.INSTANCE_NAME || 'instance1';

// Middleware
app.use(cors());
app.use(express.json());

// File upload configuration
const uploadDir = process.env.UPLOAD_DIR || '/app/uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || `${INSTANCE_NAME}_db`,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

const JWT_SECRET = process.env.JWT_SECRET || 'superkubernetex-secret-key';

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user has access to this instance
    const instanceAccess = decoded.instanceAccess || [];
    if (!instanceAccess.includes(INSTANCE_NAME)) {
      return res.status(403).json({ error: 'Access denied to this instance' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'instance-service',
    instance: INSTANCE_NAME 
  });
});

// Ready check
app.get('/ready', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ready', instance: INSTANCE_NAME });
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message });
  }
});

// Instance info
app.get('/api/instance/info', (req, res) => {
  res.json({
    name: INSTANCE_NAME,
    version: '1.0.0',
    status: 'running'
  });
});

// ============ PAGES API ============

// List pages
app.get('/api/pages', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const { published } = req.query;

  try {
    let query = 'SELECT id, title, slug, is_published, created_at, updated_at FROM pages WHERE user_id = $1';
    const params = [userId];

    if (published === 'true') {
      query += ' AND is_published = true';
    } else if (published === 'false') {
      query += ' AND is_published = false';
    }

    query += ' ORDER BY updated_at DESC';

    const result = await pool.query(query, params);
    res.json({ pages: result.rows, instance: INSTANCE_NAME });
  } catch (error) {
    console.error('Error listing pages:', error);
    res.status(500).json({ error: 'Failed to list pages' });
  }
});

// Get single page
app.get('/api/pages/:id', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const pageId = req.params.id;

  try {
    const result = await pool.query(
      'SELECT * FROM pages WHERE id = $1 AND user_id = $2',
      [pageId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Page not found' });
    }

    res.json({ page: result.rows[0], instance: INSTANCE_NAME });
  } catch (error) {
    console.error('Error getting page:', error);
    res.status(500).json({ error: 'Failed to get page' });
  }
});

// Get page by slug (public)
app.get('/api/pages/slug/:slug', async (req, res) => {
  const slug = req.params.slug;

  try {
    const result = await pool.query(
      'SELECT id, title, slug, content, created_at, updated_at FROM pages WHERE slug = $1 AND is_published = true',
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Page not found' });
    }

    res.json({ page: result.rows[0], instance: INSTANCE_NAME });
  } catch (error) {
    console.error('Error getting page by slug:', error);
    res.status(500).json({ error: 'Failed to get page' });
  }
});

// Create page
app.post('/api/pages', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const { title, slug, content, isPublished } = req.body;

  if (!title || !slug) {
    return res.status(400).json({ error: 'Title and slug are required' });
  }

  try {
    // Check for duplicate slug
    const existing = await pool.query(
      'SELECT id FROM pages WHERE slug = $1 AND user_id = $2',
      [slug, userId]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Slug already exists' });
    }

    const result = await pool.query(
      `INSERT INTO pages (user_id, title, slug, content, is_published) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [userId, title, slug, content || '', isPublished || false]
    );

    res.status(201).json({ page: result.rows[0], instance: INSTANCE_NAME });
  } catch (error) {
    console.error('Error creating page:', error);
    res.status(500).json({ error: 'Failed to create page' });
  }
});

// Update page
app.put('/api/pages/:id', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const pageId = req.params.id;
  const { title, slug, content, isPublished } = req.body;

  try {
    // Check ownership
    const existing = await pool.query(
      'SELECT id FROM pages WHERE id = $1 AND user_id = $2',
      [pageId, userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Page not found' });
    }

    // Check for duplicate slug (excluding current page)
    if (slug) {
      const slugCheck = await pool.query(
        'SELECT id FROM pages WHERE slug = $1 AND user_id = $2 AND id != $3',
        [slug, userId, pageId]
      );

      if (slugCheck.rows.length > 0) {
        return res.status(409).json({ error: 'Slug already exists' });
      }
    }

    const result = await pool.query(
      `UPDATE pages 
       SET title = COALESCE($1, title),
           slug = COALESCE($2, slug),
           content = COALESCE($3, content),
           is_published = COALESCE($4, is_published),
           updated_at = NOW()
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [title, slug, content, isPublished, pageId, userId]
    );

    res.json({ page: result.rows[0], instance: INSTANCE_NAME });
  } catch (error) {
    console.error('Error updating page:', error);
    res.status(500).json({ error: 'Failed to update page' });
  }
});

// Delete page
app.delete('/api/pages/:id', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const pageId = req.params.id;

  try {
    const result = await pool.query(
      'DELETE FROM pages WHERE id = $1 AND user_id = $2 RETURNING id',
      [pageId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Page not found' });
    }

    res.json({ message: 'Page deleted successfully', instance: INSTANCE_NAME });
  } catch (error) {
    console.error('Error deleting page:', error);
    res.status(500).json({ error: 'Failed to delete page' });
  }
});

// ============ ASSETS API ============

// List assets
app.get('/api/assets', authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      'SELECT id, filename, filepath, mimetype, size_bytes, created_at FROM assets WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.json({ assets: result.rows, instance: INSTANCE_NAME });
  } catch (error) {
    console.error('Error listing assets:', error);
    res.status(500).json({ error: 'Failed to list assets' });
  }
});

// Upload asset
app.post('/api/assets', authenticateToken, upload.single('file'), async (req, res) => {
  const userId = req.user.userId;

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO assets (user_id, filename, filepath, mimetype, size_bytes) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [
        userId,
        req.file.originalname,
        req.file.filename,
        req.file.mimetype,
        req.file.size
      ]
    );

    res.status(201).json({ asset: result.rows[0], instance: INSTANCE_NAME });
  } catch (error) {
    console.error('Error uploading asset:', error);
    // Clean up uploaded file on error
    if (req.file) {
      fs.unlink(path.join(uploadDir, req.file.filename), () => {});
    }
    res.status(500).json({ error: 'Failed to upload asset' });
  }
});

// Get asset file
app.get('/api/assets/:id/file', async (req, res) => {
  const assetId = req.params.id;

  try {
    const result = await pool.query(
      'SELECT filename, filepath, mimetype FROM assets WHERE id = $1',
      [assetId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const asset = result.rows[0];
    const filePath = path.join(uploadDir, asset.filepath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.setHeader('Content-Type', asset.mimetype);
    res.setHeader('Content-Disposition', `inline; filename="${asset.filename}"`);
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error getting asset file:', error);
    res.status(500).json({ error: 'Failed to get asset' });
  }
});

// Delete asset
app.delete('/api/assets/:id', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const assetId = req.params.id;

  try {
    const result = await pool.query(
      'DELETE FROM assets WHERE id = $1 AND user_id = $2 RETURNING filepath',
      [assetId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Delete file
    const filepath = result.rows[0].filepath;
    const fullPath = path.join(uploadDir, filepath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    res.json({ message: 'Asset deleted successfully', instance: INSTANCE_NAME });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ error: 'Failed to delete asset' });
  }
});

// ============ STATS API ============

// Get instance stats
app.get('/api/stats', authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const pagesCount = await pool.query(
      'SELECT COUNT(*) as count FROM pages WHERE user_id = $1',
      [userId]
    );

    const publishedCount = await pool.query(
      'SELECT COUNT(*) as count FROM pages WHERE user_id = $1 AND is_published = true',
      [userId]
    );

    const assetsCount = await pool.query(
      'SELECT COUNT(*) as count, COALESCE(SUM(size_bytes), 0) as total_size FROM assets WHERE user_id = $1',
      [userId]
    );

    res.json({
      instance: INSTANCE_NAME,
      stats: {
        totalPages: parseInt(pagesCount.rows[0].count),
        publishedPages: parseInt(publishedCount.rows[0].count),
        draftPages: parseInt(pagesCount.rows[0].count) - parseInt(publishedCount.rows[0].count),
        totalAssets: parseInt(assetsCount.rows[0].count),
        totalStorageBytes: parseInt(assetsCount.rows[0].total_size)
      }
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Serve uploaded files statically
app.use('/uploads', express.static(uploadDir));

// Start server
app.listen(PORT, () => {
  console.log(`Instance service (${INSTANCE_NAME}) running on port ${PORT}`);
});

