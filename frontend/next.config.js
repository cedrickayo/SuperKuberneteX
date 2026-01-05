/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    AUTH_API_URL: process.env.AUTH_API_URL || 'http://localhost:4000',
    PAYMENT_API_URL: process.env.PAYMENT_API_URL || 'http://localhost:4001',
    INSTANCE1_API_URL: process.env.INSTANCE1_API_URL || 'http://localhost:5001',
    INSTANCE2_API_URL: process.env.INSTANCE2_API_URL || 'http://localhost:5002',
    INSTANCE3_API_URL: process.env.INSTANCE3_API_URL || 'http://localhost:5003',
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder'
  }
}

module.exports = nextConfig

