/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_AUTH_API_URL: process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://auth.superkubernetex.local',
    NEXT_PUBLIC_PAYMENT_API_URL: process.env.NEXT_PUBLIC_PAYMENT_API_URL || 'http://payment.superkubernetex.local',
    NEXT_PUBLIC_INSTANCE1_API_URL: process.env.NEXT_PUBLIC_INSTANCE1_API_URL || 'http://inst1.superkubernetex.local',
    NEXT_PUBLIC_INSTANCE2_API_URL: process.env.NEXT_PUBLIC_INSTANCE2_API_URL || 'http://inst2.superkubernetex.local',
    NEXT_PUBLIC_INSTANCE3_API_URL: process.env.NEXT_PUBLIC_INSTANCE3_API_URL || 'http://inst3.superkubernetex.local',
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder'
  }
}

module.exports = nextConfig

