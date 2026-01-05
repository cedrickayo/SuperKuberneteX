'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/login')
      return
    }

    setUser(JSON.parse(userData))
    fetchSubscription(token)
  }, [router])

  const fetchSubscription = async (token) => {
    try {
      const response = await fetch(`${process.env.PAYMENT_API_URL}/api/payment/subscription`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setSubscription(data.subscription)
    } catch (error) {
      console.error('Error fetching subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  const instanceAccess = user?.instanceAccess || []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-primary-600">SuperKuberneteX</Link>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Welcome, {user?.firstName}</span>
            <button onClick={handleLogout} className="btn-secondary">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Subscription Status */}
        <div className="card mb-8">
          <h2 className="text-xl font-semibold mb-4">Your Subscription</h2>
          {subscription ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-medium">{subscription.plan_name} Plan</p>
                <p className="text-gray-600">
                  Access to: {subscription.instance_access?.join(', ') || 'None'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">${subscription.price}/mo</p>
                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  {subscription.status}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">You don't have an active subscription</p>
              <Link href="/pricing" className="btn-primary">Choose a Plan</Link>
            </div>
          )}
        </div>

        {/* Instances */}
        <h2 className="text-xl font-semibold mb-4">Your Instances</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {['instance1', 'instance2', 'instance3'].map((instance, index) => {
            const hasAccess = instanceAccess.includes(instance)
            return (
              <div 
                key={instance} 
                className={`card ${hasAccess ? 'border-2 border-primary-500' : 'opacity-50'}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Instance {index + 1}</h3>
                  {hasAccess ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      Locked
                    </span>
                  )}
                </div>
                
                <p className="text-gray-600 text-sm mb-4">
                  Manage pages and assets for this instance.
                </p>

                {hasAccess ? (
                  <Link 
                    href={`/instance/${index + 1}`}
                    className="btn-primary w-full block text-center"
                  >
                    Open Instance
                  </Link>
                ) : (
                  <button 
                    disabled 
                    className="btn-secondary w-full opacity-50 cursor-not-allowed"
                  >
                    Upgrade to Access
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid md:grid-cols-4 gap-6">
          <div className="card">
            <p className="text-gray-600 text-sm">Total Instances</p>
            <p className="text-3xl font-bold">{instanceAccess.length}</p>
          </div>
          <div className="card">
            <p className="text-gray-600 text-sm">Plan</p>
            <p className="text-3xl font-bold">{subscription?.plan_name || 'None'}</p>
          </div>
          <div className="card">
            <p className="text-gray-600 text-sm">Status</p>
            <p className="text-3xl font-bold text-green-600">
              {subscription ? 'Active' : 'Inactive'}
            </p>
          </div>
          <div className="card">
            <p className="text-gray-600 text-sm">Member Since</p>
            <p className="text-xl font-bold">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

