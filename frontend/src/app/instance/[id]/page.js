'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function InstancePage() {
  const router = useRouter()
  const params = useParams()
  const instanceId = params.id

  const [pages, setPages] = useState([])
  const [assets, setAssets] = useState([])
  const [stats, setStats] = useState(null)
  const [activeTab, setActiveTab] = useState('pages')
  const [loading, setLoading] = useState(true)
  const [showNewPage, setShowNewPage] = useState(false)
  const [newPage, setNewPage] = useState({ title: '', slug: '', content: '' })

  const API_URLS = {
    '1': process.env.NEXT_PUBLIC_INSTANCE1_API_URL,
    '2': process.env.NEXT_PUBLIC_INSTANCE2_API_URL,
    '3': process.env.NEXT_PUBLIC_INSTANCE3_API_URL
  }

  const apiUrl = API_URLS[instanceId]

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push('/login')
      return
    }

    if (!apiUrl) {
      router.push('/dashboard')
      return
    }

    fetchData(token)
  }, [instanceId, router, apiUrl])

  const fetchData = async (token) => {
    const headers = { 'Authorization': `Bearer ${token}` }

    try {
      const [pagesRes, assetsRes, statsRes] = await Promise.all([
        fetch(`${apiUrl}/api/pages`, { headers }),
        fetch(`${apiUrl}/api/assets`, { headers }),
        fetch(`${apiUrl}/api/stats`, { headers })
      ])

      if (pagesRes.ok) {
        const pagesData = await pagesRes.json()
        setPages(pagesData.pages || [])
      }

      if (assetsRes.ok) {
        const assetsData = await assetsRes.json()
        setAssets(assetsData.assets || [])
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData.stats)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const createPage = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('accessToken')

    try {
      const response = await fetch(`${apiUrl}/api/pages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPage)
      })

      if (response.ok) {
        setShowNewPage(false)
        setNewPage({ title: '', slug: '', content: '' })
        fetchData(token)
      }
    } catch (error) {
      console.error('Error creating page:', error)
    }
  }

  const deletePage = async (pageId) => {
    if (!confirm('Are you sure you want to delete this page?')) return

    const token = localStorage.getItem('accessToken')

    try {
      const response = await fetch(`${apiUrl}/api/pages/${pageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        fetchData(token)
      }
    } catch (error) {
      console.error('Error deleting page:', error)
    }
  }

  const uploadAsset = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const token = localStorage.getItem('accessToken')
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${apiUrl}/api/assets`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })

      if (response.ok) {
        fetchData(token)
      }
    } catch (error) {
      console.error('Error uploading asset:', error)
    }
  }

  const deleteAsset = async (assetId) => {
    if (!confirm('Are you sure you want to delete this asset?')) return

    const token = localStorage.getItem('accessToken')

    try {
      const response = await fetch(`${apiUrl}/api/assets/${assetId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        fetchData(token)
      }
    } catch (error) {
      console.error('Error deleting asset:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading instance {instanceId}...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              Back to Dashboard
            </Link>
            <span className="text-gray-300">|</span>
            <h1 className="text-xl font-bold text-primary-600">Instance {instanceId}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        {stats && (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <p className="text-gray-600 text-sm">Total Pages</p>
              <p className="text-3xl font-bold">{stats.totalPages}</p>
            </div>
            <div className="card">
              <p className="text-gray-600 text-sm">Published</p>
              <p className="text-3xl font-bold text-green-600">{stats.publishedPages}</p>
            </div>
            <div className="card">
              <p className="text-gray-600 text-sm">Drafts</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.draftPages}</p>
            </div>
            <div className="card">
              <p className="text-gray-600 text-sm">Assets</p>
              <p className="text-3xl font-bold">{stats.totalAssets}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('pages')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'pages' 
                ? 'bg-primary-600 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Pages ({pages.length})
          </button>
          <button
            onClick={() => setActiveTab('assets')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'assets' 
                ? 'bg-primary-600 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Assets ({assets.length})
          </button>
        </div>

        {/* Pages Tab */}
        {activeTab === 'pages' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Pages</h2>
              <button onClick={() => setShowNewPage(true)} className="btn-primary">
                New Page
              </button>
            </div>

            {showNewPage && (
              <div className="card mb-6">
                <h3 className="text-lg font-semibold mb-4">Create New Page</h3>
                <form onSubmit={createPage} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      required
                      className="input-field"
                      value={newPage.title}
                      onChange={(e) => setNewPage({ ...newPage, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                    <input
                      type="text"
                      required
                      className="input-field"
                      value={newPage.slug}
                      onChange={(e) => setNewPage({ ...newPage, slug: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                    <textarea
                      rows={4}
                      className="input-field"
                      value={newPage.content}
                      onChange={(e) => setNewPage({ ...newPage, content: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary">Create</button>
                    <button type="button" onClick={() => setShowNewPage(false)} className="btn-secondary">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-4">
              {pages.length === 0 ? (
                <div className="card text-center py-8 text-gray-600">
                  No pages yet. Create your first page!
                </div>
              ) : (
                pages.map((page) => (
                  <div key={page.id} className="card flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">{page.title}</h3>
                      <p className="text-sm text-gray-600">/{page.slug}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        page.is_published 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {page.is_published ? 'Published' : 'Draft'}
                      </span>
                      <button 
                        onClick={() => deletePage(page.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Assets Tab */}
        {activeTab === 'assets' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Assets</h2>
              <label className="btn-primary cursor-pointer">
                Upload Asset
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={uploadAsset}
                  accept="image/*,application/pdf"
                />
              </label>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              {assets.length === 0 ? (
                <div className="col-span-4 card text-center py-8 text-gray-600">
                  No assets yet. Upload your first file!
                </div>
              ) : (
                assets.map((asset) => (
                  <div key={asset.id} className="card">
                    <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                      {asset.mimetype?.startsWith('image/') ? (
                        <img 
                          src={`${apiUrl}/api/assets/${asset.id}/file`}
                          alt={asset.filename}
                          className="max-h-full max-w-full object-contain rounded-lg"
                        />
                      ) : (
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                    </div>
                    <p className="text-sm font-medium truncate">{asset.filename}</p>
                    <p className="text-xs text-gray-600">
                      {(asset.size_bytes / 1024).toFixed(1)} KB
                    </p>
                    <button 
                      onClick={() => deleteAsset(asset.id)}
                      className="text-red-600 hover:text-red-800 text-sm mt-2"
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

