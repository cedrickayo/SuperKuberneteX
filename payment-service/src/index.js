const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4001;

// Stripe configuration
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Middleware for JSON (except for webhooks)
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payment/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.use(cors());

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'superkube',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

const JWT_SECRET = process.env.JWT_SECRET || 'superkubernetex-secret-key';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://superkubernetex.local';

// Plan configuration with Stripe Price IDs
const PLANS = {
  starter: {
    name: 'Starter',
    priceId: process.env.STRIPE_PRICE_STARTER || 'price_starter',
    price: 9.99,
    instanceAccess: ['instance1']
  },
  professional: {
    name: 'Professional',
    priceId: process.env.STRIPE_PRICE_PROFESSIONAL || 'price_professional',
    price: 29.99,
    instanceAccess: ['instance1', 'instance2']
  },
  enterprise: {
    name: 'Enterprise',
    priceId: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise',
    price: 99.99,
    instanceAccess: ['instance1', 'instance2', 'instance3']
  }
};

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'payment-service' });
});

// Ready check
app.get('/ready', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message });
  }
});

// Get available plans
app.get('/api/payment/plans', (req, res) => {
  const plans = Object.entries(PLANS).map(([key, plan]) => ({
    id: key,
    name: plan.name,
    price: plan.price,
    instanceAccess: plan.instanceAccess
  }));
  res.json(plans);
});

// Create checkout session
app.post('/api/payment/checkout', authenticateToken, async (req, res) => {
  const { planId } = req.body;
  const userId = req.user.userId;

  if (!planId || !PLANS[planId]) {
    return res.status(400).json({ error: 'Invalid plan' });
  }

  const plan = PLANS[planId];

  try {
    // Get or create Stripe customer
    const userResult = await pool.query(
      'SELECT email FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userEmail = userResult.rows[0].email;

    // Check existing subscription
    const existingSub = await pool.query(
      'SELECT stripe_customer_id FROM subscriptions WHERE user_id = $1 AND status = $2',
      [userId, 'active']
    );

    let customerId;

    if (existingSub.rows.length > 0 && existingSub.rows[0].stripe_customer_id) {
      customerId = existingSub.rows[0].stripe_customer_id;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { userId: userId.toString() }
      });
      customerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `SuperKuberneteX ${plan.name} Plan`,
              description: `Access to: ${plan.instanceAccess.join(', ')}`
            },
            unit_amount: Math.round(plan.price * 100),
            recurring: {
              interval: 'month'
            }
          },
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/payment/cancel`,
      metadata: {
        userId: userId.toString(),
        planId: planId
      }
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Stripe webhook
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      // For development without webhook secret
      event = JSON.parse(req.body);
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      await handleCheckoutComplete(session);
      break;
    }
    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      await handleSubscriptionUpdate(subscription);
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      await handleSubscriptionCancelled(subscription);
      break;
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

async function handleCheckoutComplete(session) {
  const userId = parseInt(session.metadata.userId);
  const planId = session.metadata.planId;
  const plan = PLANS[planId];

  if (!plan) {
    console.error('Invalid plan in checkout session:', planId);
    return;
  }

  try {
    // Get plan ID from database
    const planResult = await pool.query(
      'SELECT id FROM plans WHERE name = $1',
      [planId]
    );

    const dbPlanId = planResult.rows[0]?.id || 1;

    // Deactivate existing subscriptions
    await pool.query(
      'UPDATE subscriptions SET status = $1 WHERE user_id = $2 AND status = $3',
      ['cancelled', userId, 'active']
    );

    // Create new subscription
    await pool.query(
      `INSERT INTO subscriptions 
       (user_id, plan_id, stripe_subscription_id, stripe_customer_id, status, instance_access, started_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        userId,
        dbPlanId,
        session.subscription,
        session.customer,
        'active',
        plan.instanceAccess
      ]
    );

    console.log(`Subscription created for user ${userId} with plan ${planId}`);
  } catch (error) {
    console.error('Error handling checkout complete:', error);
  }
}

async function handleSubscriptionUpdate(subscription) {
  try {
    await pool.query(
      'UPDATE subscriptions SET status = $1 WHERE stripe_subscription_id = $2',
      [subscription.status === 'active' ? 'active' : 'inactive', subscription.id]
    );
  } catch (error) {
    console.error('Error updating subscription:', error);
  }
}

async function handleSubscriptionCancelled(subscription) {
  try {
    await pool.query(
      'UPDATE subscriptions SET status = $1 WHERE stripe_subscription_id = $2',
      ['cancelled', subscription.id]
    );
  } catch (error) {
    console.error('Error cancelling subscription:', error);
  }
}

// Get user's subscription
app.get('/api/payment/subscription', authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `SELECT s.id, s.status, s.instance_access, s.started_at, s.expires_at,
              p.name as plan_name, p.price, p.features
       FROM subscriptions s
       JOIN plans p ON s.plan_id = p.id
       WHERE s.user_id = $1 AND s.status = 'active'
       ORDER BY s.created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({ subscription: null });
    }

    res.json({ subscription: result.rows[0] });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

// Cancel subscription
app.post('/api/payment/cancel', authenticateToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      'SELECT stripe_subscription_id FROM subscriptions WHERE user_id = $1 AND status = $2',
      [userId, 'active']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    const stripeSubId = result.rows[0].stripe_subscription_id;

    if (stripeSubId) {
      await stripe.subscriptions.cancel(stripeSubId);
    }

    await pool.query(
      'UPDATE subscriptions SET status = $1 WHERE user_id = $2 AND status = $3',
      ['cancelled', userId, 'active']
    );

    res.json({ message: 'Subscription cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Payment service running on port ${PORT}`);
});

