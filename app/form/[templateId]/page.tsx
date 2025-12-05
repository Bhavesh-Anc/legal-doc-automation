'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Import template-specific form components
import DivorcePetitionFormWrapper from './wrappers/DivorcePetitionFormWrapper'
import CustodyAgreementFormWrapper from './wrappers/CustodyAgreementFormWrapper'
import PropertySettlementFormWrapper from './wrappers/PropertySettlementFormWrapper'
import ChildSupportFormWrapper from './wrappers/ChildSupportFormWrapper'
import SpousalSupportFormWrapper from './wrappers/SpousalSupportFormWrapper'

interface DocumentTemplate {
  id: string
  name: string
  description: string | null
  category: string
  state: string
  form_schema: any
  is_active: boolean
  estimated_time?: string | null
  prompt_template?: string | null
  created_at?: string
  updated_at?: string
}

export default function PublicFormPage() {
  const params = useParams()
  const router = useRouter()
  const templateId = params.templateId as string

  const [template, setTemplate] = useState<DocumentTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [docCount, setDocCount] = useState(0)

  useEffect(() => {
    async function fetchTemplate() {
      try {
        const supabase = createClient()

        const { data, error: fetchError } = await supabase
          .from('document_templates')
          .select('*')
          .eq('id', templateId)
          .eq('is_active', true)
          .single()

        if (fetchError) throw fetchError

        if (!data) {
          throw new Error('Template not found')
        }

        setTemplate(data)
      } catch (err: any) {
        console.error('Error fetching template:', err)
        setError(err.message || 'Failed to load template')
      } finally {
        setLoading(false)
      }
    }

    async function fetchDocumentCount() {
      try {
        const supabase = createClient()
        const { count } = await supabase
          .from('generated_documents')
          .select('*', { count: 'exact', head: true })

        if (count) {
          setDocCount(count)
        }
      } catch (err) {
        console.error('Error fetching count:', err)
      }
    }

    if (templateId) {
      fetchTemplate()
      fetchDocumentCount()
    }
  }, [templateId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading form...</p>
        </div>
      </div>
    )
  }

  if (error || !template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-700 mb-4">{error || 'Template not found'}</p>
          <button
            onClick={() => router.push('/start')}
            className="inline-block px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Back to Templates
          </button>
        </div>
      </div>
    )
  }

  // Render the appropriate form wrapper based on template ID
  const renderForm = () => {
    switch (templateId) {
      case 'divorce-petition-ca':
        return <DivorcePetitionFormWrapper template={template} />
      case 'custody-agreement-ca':
        return <CustodyAgreementFormWrapper template={template} />
      case 'property-settlement-ca':
        return <PropertySettlementFormWrapper template={template} />
      case 'child-support-ca':
        return <ChildSupportFormWrapper template={template} />
      case 'spousal-support-ca':
        return <SpousalSupportFormWrapper template={template} />
      default:
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                Form Not Available
              </h3>
              <p className="text-yellow-700 mb-4">
                The form for "{template.name}" is not yet implemented. Please contact support.
              </p>
              <button
                onClick={() => router.push('/start')}
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
              >
                Back to Templates
              </button>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Trust banner */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex justify-center items-center gap-6 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium text-blue-600">{docCount.toLocaleString()}+</span> documents generated
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              100% Free
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              No Credit Card
            </div>
          </div>
        </div>
      </div>

      {renderForm()}
    </div>
  )
}
