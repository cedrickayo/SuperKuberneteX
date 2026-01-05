'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Home() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    const userData = localStorage.getItem('user')
    if (token && userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-600">SuperKuberneteX</h1>
          <nav className="flex gap-4">
            {user ? (
              <>
                <Link href="/dashboard" className="btn-primary">Dashboard</Link>
                <button 
                  onClick={() => {
                    localStorage.clear()
                    setUser(null)
                  }}
                  className="btn-secondary"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-secondary">Login</Link>
                <Link href="/register" className="btn-primary">Register</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Multi-Instance Platform
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Build and manage your content across multiple isolated instances. 
            Powered by Kubernetes for maximum scalability and reliability.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="card">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Isolated Instances</h3>
            <p className="text-gray-600">
              Each instance has its own database and storage, ensuring complete data isolation.
            </p>
          </div>

          <div className="card">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Secure by Design</h3>
            <p className="text-gray-600">
              JWT authentication, encrypted secrets, and role-based access control.
            </p>
          </div>

          <div className="card">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Auto-Scaling</h3>
            <p className="text-gray-600">
              Kubernetes-native scaling ensures your platform grows with your needs.
            </p>
          </div>
        </div>

        {/* Pricing */}
        <h3 className="text-3xl font-bold text-center mb-8">Choose Your Plan</h3>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="card border-2 border-gray-200">
            <h4 className="text-xl font-semibold mb-2">Starter</h4>
            <p className="text-4xl font-bold mb-4">9.99<span className="text-lg font-normal text-gray-500">/mo</span></p>
            <ul className="space-y-2 mb-6 text-gray-600">
              <li>1 Instance</li>
              <li>10 Pages</li>
              <li>100 Assets</li>
            </ul>
            <Link href="/register" className="btn-secondary w-full block text-center">Get Started</Link>
          </div>

          <div className="card border-2 border-primary-500">
            <div className="bg-primary-500 text-white text-xs font-semibold px-2 py-1 rounded absolute -mt-9 ml-auto mr-auto">POPULAR</div>
            <h4 className="text-xl font-semibold mb-2">Professional</h4>
            <p className="text-4xl font-bold mb-4">29.99<span className="text-lg font-normal text-gray-500">/mo</span></p>
            <ul className="space-y-2 mb-6 text-gray-600">
              <li>2 Instances</li>
              <li>50 Pages</li>
              <li>500 Assets</li>
            </ul>
            <Link href="/register" className="btn-primary w-full block text-center">Get Started</Link>
          </div>

          <div className="card border-2 border-gray-200">
            <h4 className="text-xl font-semibold mb-2">Enterprise</h4>
            <p className="text-4xl font-bold mb-4">99.99<span className="text-lg font-normal text-gray-500">/mo</span></p>
            <ul className="space-y-2 mb-6 text-gray-600">
              <li>3 Instances</li>
              <li>Unlimited Pages</li>
              <li>Unlimited Assets</li>
            </ul>
            <Link href="/register" className="btn-secondary w-full block text-center">Get Started</Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>SuperKuberneteX - Multi-Instance Platform</p>
          <p className="text-sm mt-2">Powered by Kubernetes</p>
        </div>
      </footer>
    </div>
  )
}

