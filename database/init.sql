-- SuperKuberneteX Database Initialization
-- Ce script cree les 4 bases de donnees et leurs tables

-- Base principale SuperKube
\c superkube;

CREATE TABLE IF NOT EXISTS plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    features TEXT[],
    max_pages INTEGER DEFAULT 10,
    max_assets INTEGER DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    plan_id INTEGER REFERENCES plans(id),
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    instance_access TEXT[],
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertion des plans par defaut
INSERT INTO plans (name, price, features, max_pages, max_assets) VALUES
('starter', 9.99, ARRAY['1 instance', '10 pages', '100 assets'], 10, 100),
('professional', 29.99, ARRAY['2 instances', '50 pages', '500 assets'], 50, 500),
('enterprise', 99.99, ARRAY['3 instances', 'unlimited pages', 'unlimited assets'], -1, -1);

-- Utilisateur de test
INSERT INTO users (email, password_hash, first_name, last_name) VALUES
('test@superkubernetex.com', '$2b$10$rQZ8K.5FJqzL5vG5r5z5UuZqX5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', 'Test', 'User');

-- Abonnement de test (acces aux 3 instances)
INSERT INTO subscriptions (user_id, plan_id, status, instance_access) VALUES
(1, 3, 'active', ARRAY['instance1', 'instance2', 'instance3']);

-- Base Instance 1
\c instance1_db;

CREATE TABLE IF NOT EXISTS pages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    content TEXT,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    filename VARCHAR(255) NOT NULL,
    filepath VARCHAR(500) NOT NULL,
    mimetype VARCHAR(100),
    size_bytes BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pages_user ON pages(user_id);
CREATE INDEX idx_assets_user ON assets(user_id);

-- Donnees de test Instance 1
INSERT INTO pages (user_id, title, slug, content, is_published) VALUES
(1, 'Welcome to Instance 1', 'welcome', 'This is the first page of instance 1', true),
(1, 'About Instance 1', 'about', 'About page content for instance 1', true);

-- Base Instance 2
\c instance2_db;

CREATE TABLE IF NOT EXISTS pages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    content TEXT,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    filename VARCHAR(255) NOT NULL,
    filepath VARCHAR(500) NOT NULL,
    mimetype VARCHAR(100),
    size_bytes BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pages_user ON pages(user_id);
CREATE INDEX idx_assets_user ON assets(user_id);

-- Donnees de test Instance 2
INSERT INTO pages (user_id, title, slug, content, is_published) VALUES
(1, 'Welcome to Instance 2', 'welcome', 'This is the first page of instance 2', true);

-- Base Instance 3
\c instance3_db;

CREATE TABLE IF NOT EXISTS pages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    content TEXT,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    filename VARCHAR(255) NOT NULL,
    filepath VARCHAR(500) NOT NULL,
    mimetype VARCHAR(100),
    size_bytes BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pages_user ON pages(user_id);
CREATE INDEX idx_assets_user ON assets(user_id);

-- Donnees de test Instance 3
INSERT INTO pages (user_id, title, slug, content, is_published) VALUES
(1, 'Welcome to Instance 3', 'welcome', 'This is the first page of instance 3', true);

