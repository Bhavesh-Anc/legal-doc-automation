'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { FeedbackModal } from '@/components/ui/feedback-modal'

export default function DocumentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const documentId = searchParams.get('id')

  const [document, setDocument] = useState<any>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)

  useEffect(() => {
    if (!documentId) {
      setError('No document ID provided')
      setLoading(false)
      return
    }

    async function fetchDocument(id: string) {
      try {
        const supabase = createClient()

        // Fetch document details
        const { data, error: fetchError } = await supabase
          .from('generated_documents')
          .select('*, document_templates(name)')
          .eq('id', id)
          .single()

        if (fetchError) throw fetchError

        setDocument(data)

        // Get signed URL for download
        if (data.file_url) {
          const { data: urlData, error: urlError } = await supabase.storage
            .from('documents')
            .createSignedUrl(data.file_url, 3600)

          if (urlError) throw urlError
          setDownloadUrl(urlData.signedUrl)
        }
      } catch (err: any) {
        console.error('Error fetching document:', err)
        setError(err.message || 'Failed to load document')
      } finally {
        setLoading(false)
      }
    }

    fetchDocument(documentId)
  }, [documentId])

  // Show feedback modal after a short delay
  useEffect(() => {
    if (!loading && document && !error) {
      const timer = setTimeout(() => {
        setShowFeedbackModal(true)
      }, 3000) // Show after 3 seconds

      return () => clearTimeout(timer)
    }
  }, [loading, document, error])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading document details...</p>
        </div>
      </div>
    )
  }

  if (error || !document) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-700 mb-4">{error || 'Document not found'}</p>
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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Document Generated Successfully!
          </h1>
          <p className="text-gray-600">
            Your legal document has been created and is ready for download.
          </p>
        </div>

        {/* Document Details Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Document Details
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="font-medium text-gray-700">Title:</span>
              <span className="text-gray-900">{document.title}</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="font-medium text-gray-700">Template:</span>
              <span className="text-gray-900">
                {document.document_templates?.name || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="font-medium text-gray-700">Created:</span>
              <span className="text-gray-900">
                {new Date(document.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-2">
              <span className="font-medium text-gray-700">File Size:</span>
              <span className="text-gray-900">
                {(document.file_size / 1024).toFixed(2)} KB
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Status:</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {document.status}
              </span>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            Next Steps
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Download and review your document carefully</li>
            <li>Consult with a licensed attorney before filing</li>
            <li>Make any necessary edits or corrections</li>
            <li>Print and sign the document as required</li>
            <li>File with the appropriate court or submit to relevant parties</li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {downloadUrl ? (
            <a
              href={downloadUrl}
              download
              className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download Document
            </a>
          ) : (
            <button
              disabled
              className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gray-400 cursor-not-allowed"
            >
              Download Unavailable
            </button>
          )}
          <Link
            href={`/documents/${documentId}`}
            className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            View Details
          </Link>
        </div>

        {/* Additional Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Link
            href="/documents/new"
            className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-blue-600 text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 transition-colors"
          >
            Create Another Document
          </Link>
          <Link
            href="/documents"
            className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            View All Documents
          </Link>
        </div>

        {/* Legal Disclaimer */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Legal Disclaimer:</strong> This document is generated for informational
            purposes only and does not constitute legal advice. Please consult with a licensed
            attorney in your jurisdiction before filing or using this document in any legal
            proceedings. Laws and regulations vary by state and jurisdiction.
          </p>
        </div>

        {/* Back to Dashboard */}
        <div className="text-center mt-8">
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Feedback Modal */}
      {documentId && (
        <FeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          documentId={documentId}
        />
      )}
    </div>
  )
}
