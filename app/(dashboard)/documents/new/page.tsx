'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface DocumentTemplate {
  id: string
  name: string
  description: string | null
  category: string
  state: string
  is_active: boolean
  estimated_time?: string | null
  prompt_template?: string | null
  form_schema?: any
}

export default function TemplateSelectionPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const supabase = createClient()

        const { data, error: fetchError } = await supabase
          .from('document_templates')
          .select('*')
          .eq('is_active', true)
          .order('category', { ascending: true })
          .order('name', { ascending: true })

        if (fetchError) throw fetchError

        setTemplates(data || [])
      } catch (err: any) {
        console.error('Error fetching templates:', err)
        setError(err.message || 'Failed to load templates')
      } finally {
        setLoading(false)
      }
    }

    fetchTemplates()
  }, [])

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'divorce':
        return (
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      case 'custody':
        return (
          <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        )
      case 'property':
        return (
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        )
      case 'support':
        return (
          <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return (
          <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'divorce':
        return 'bg-blue-50 border-blue-200 hover:border-blue-400'
      case 'custody':
        return 'bg-purple-50 border-purple-200 hover:border-purple-400'
      case 'property':
        return 'bg-green-50 border-green-200 hover:border-green-400'
      case 'support':
        return 'bg-orange-50 border-orange-200 hover:border-orange-400'
      default:
        return 'bg-gray-50 border-gray-200 hover:border-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading templates...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <Link
            href="/documents"
            className="inline-block px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Back to Documents
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/documents"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Documents
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Select a Document Template
          </h1>
          <p className="text-gray-600">
            Choose a document type to begin generating your legal document
          </p>
        </div>

        {/* Templates Grid */}
        {templates.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <p className="text-yellow-800 mb-2">No templates available</p>
            <p className="text-sm text-yellow-700">
              Please contact your administrator to set up document templates
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Link
                key={template.id}
                href={`/documents/new/${template.id}`}
                className={`block border-2 rounded-lg p-6 transition-all ${getCategoryColor(
                  template.category
                )}`}
              >
                <div className="flex items-start mb-4">
                  <div className="flex-shrink-0">{getCategoryIcon(template.category)}</div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {template.name}
                    </h3>
                    {template.state && (
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-white rounded">
                        {template.state}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                  {template.description}
                </p>
                <div className="flex items-center text-blue-600 font-medium">
                  <span>Create Document</span>
                  <svg
                    className="w-5 h-5 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Help Section */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            Need Help Choosing?
          </h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>
              <strong>Divorce:</strong> Start dissolution proceedings and request relief
            </p>
            <p>
              <strong>Custody:</strong> Establish legal and physical custody arrangements
            </p>
            <p>
              <strong>Property:</strong> Divide marital assets and debts
            </p>
            <p>
              <strong>Support:</strong> Calculate child or spousal support obligations
            </p>
          </div>
          <p className="mt-4 text-sm text-blue-700">
            All documents are generated with AI assistance but should be reviewed by a licensed
            attorney before filing.
          </p>
        </div>
      </div>
    </div>
  )
}
