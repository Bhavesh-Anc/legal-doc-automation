import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Download, FileText, Calendar, User } from 'lucide-react'
import Link from 'next/link'

export default async function DocumentDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user's organization
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  // Fetch document
  const { data: document, error } = await supabase
    .from('generated_documents')
    .select('*')
    .eq('id', params.id)
    .eq('organization_id', profile.organization_id)
    .single()

  if (error || !document) {
    notFound()
  }

  // Get signed URL for download
  let downloadUrl: string | undefined
  if (document.file_url) {
    const { data: urlData } = await supabase.storage
      .from('documents')
      .createSignedUrl(document.file_url, 3600) // 1 hour expiry
    downloadUrl = urlData?.signedUrl
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      case 'archived':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/documents">
          <Button variant="ghost" size="sm" className="mb-4">
            ← Back to Documents
          </Button>
        </Link>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{document.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Created {new Date(document.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(document.status)}`}>
                {document.status}
              </span>
            </div>
          </div>

          {downloadUrl && (
            <a href={downloadUrl} download>
              <Button>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Document Info */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-600" />
            Document Details
          </h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Template</dt>
              <dd className="mt-1 text-sm text-gray-900">{document.template_id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">File Size</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {document.file_size ? `${Math.round(document.file_size / 1024)} KB` : 'N/A'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(document.updated_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <User className="w-5 h-5 mr-2 text-blue-600" />
            Form Data
          </h2>
          <dl className="space-y-3">
            {Object.entries(document.form_data as Record<string, any>).map(([key, value]) => (
              <div key={key}>
                <dt className="text-sm font-medium text-gray-500 capitalize">
                  {key.replace(/_/g, ' ')}
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Document Preview</h2>
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">
            Preview functionality coming soon. Download the document to view it.
          </p>
          {downloadUrl && (
            <a href={downloadUrl} download>
              <Button>
                <Download className="w-4 h-4 mr-2" />
                Download Document
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Legal Disclaimer:</strong> This document was generated using automated software
          and should be reviewed by a qualified attorney before filing with any court. LegalDocAuto
          does not provide legal advice.
        </p>
      </div>
    </div>
  )
}
