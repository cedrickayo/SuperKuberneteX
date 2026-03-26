'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Pricing() {
  const router = useRouter()
  const [loading, setLoading] = useState(null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    const userData = localStorage.getItem('user')
    if (token && userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleSubscribe = async (planId) => {
    const token = localStorage.getItem('accessToken')
    
    if (!token) {
      router.push('/login')
      return
    }

    setLoading(planId)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_PAYMENT_API_URL}/api/payment/checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ planId })
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Failed to create checkout session')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('An error occurred')
    } finally {
      setLoading(null)
    }
  }

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 9.99,
      features: ['1 Instance', '10 Pages', '100 Assets', 'Email Support'],
      instances: ['instance1']
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 29.99,
      features: ['2 Instances', '50 Pages per Instance', '500 Assets per Instance', 'Priority Support'],
      instances: ['instance1', 'instance2'],
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 99.99,
      features: ['3 Instances', 'Unlimited Pages', 'Unlimited Assets', 'Dedicated Support', 'SLA Guarantee'],
      instances: ['instance1', 'instance2', 'instance3']
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-primary-600">SuperKuberneteX</Link>
          <nav className="flex gap-4">
            {user ? (
              <Link href="/dashboard" className="btn-secondary">Dashboard</Link>
            ) : (
              <>
                <Link href="/login" className="btn-secondary">Login</Link>
                <Link href="/register" className="btn-primary">Register</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-600">
            Select the plan that best fits your needs. Upgrade or downgrade anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              className={`card relative ${plan.popular ? 'border-2 border-primary-500' : 'border border-gray-200'}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
                <p className="text-5xl font-bold mb-2">
                  ${plan.price}
                  <span className="text-lg font-normal text-gray-500">/mo</span>
                </p>
              </div>

              <ul className="space-y-3 my-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-4 text-center">
                  Access to: {plan.instances.join(', ')}
                </p>
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading === plan.id}
                  className={`w-full ${plan.popular ? 'btn-primary' : 'btn-secondary'} disabled:opacity-50`}
                >
                  {loading === plan.id ? 'Processing...' : 'Subscribe Now'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold mb-4">Frequently Asked Questions</h3>
          <div className="max-w-2xl mx-auto space-y-4 text-left">
            <div className="card">
              <h4 className="font-semibold mb-2">Can I change my plan later?</h4>
              <p className="text-gray-600">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
            </div>
            <div className="card">
              <h4 className="font-semibold mb-2">What happens to my data if I downgrade?</h4>
              <p className="text-gray-600">Your data is preserved, but you may lose access to some instances until you upgrade again.</p>
            </div>
            <div className="card">
              <h4 className="font-semibold mb-2">Is there a free trial?</h4>
              <p className="text-gray-600">Contact us for a demo and trial period for enterprise customers.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

