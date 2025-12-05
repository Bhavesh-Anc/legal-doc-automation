'use client'

import { useState } from 'react'
import { Button } from './button'

interface PreviewField {
  label: string
  value: string | boolean | undefined
  section?: string
}

interface DocumentPreviewProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  templateName: string
  formData: Record<string, any>
  fieldLabels: Record<string, string>
  sections?: Record<string, string[]>
}

export function DocumentPreview({
  isOpen,
  onClose,
  onConfirm,
  templateName,
  formData,
  fieldLabels,
  sections,
}: DocumentPreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  if (!isOpen) return null

  const handleConfirm = async () => {
    setIsGenerating(true)
    await onConfirm()
    setIsGenerating(false)
  }

  const formatValue = (value: any): string => {
    if (value === undefined || value === null || value === '') return 'Not provided'
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    if (typeof value === 'string') return value
    return String(value)
  }

  const renderFields = () => {
    if (sections) {
      // Render by sections if provided
      return Object.entries(sections).map(([sectionName, fields]) => {
        const sectionFields = fields
          .filter(field => formData[field] !== undefined)
          .map(field => ({
            label: fieldLabels[field] || field,
            value: formatValue(formData[field]),
          }))

        if (sectionFields.length === 0) return null

        return (
          <div key={sectionName} className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              {sectionName}
            </h3>
            <div className="space-y-2">
              {sectionFields.map((field, idx) => (
                <div key={idx} className="grid grid-cols-3 gap-4 py-2">
                  <dt className="text-sm font-medium text-gray-600">{field.label}</dt>
                  <dd className="text-sm text-gray-900 col-span-2">{field.value}</dd>
                </div>
              ))}
            </div>
          </div>
        )
      })
    } else {
      // Render all fields if no sections
      return (
        <div className="space-y-2">
          {Object.entries(formData)
            .filter(([_, value]) => value !== undefined && value !== '' && value !== false)
            .map(([key, value]) => (
              <div key={key} className="grid grid-cols-3 gap-4 py-2 border-b border-gray-100">
                <dt className="text-sm font-medium text-gray-600">
                  {fieldLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </dt>
                <dd className="text-sm text-gray-900 col-span-2">{formatValue(value)}</dd>
              </div>
            ))}
        </div>
      )
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Review Your Information</h2>
              <p className="text-sm text-gray-600 mt-1">
                Please review all information before generating your {templateName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close preview"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-blue-900 mb-1">Important Notice</h3>
                <p className="text-sm text-blue-800">
                  This preview shows the information you provided. The AI will use this data to generate a
                  complete, court-ready legal document. Review carefully for accuracy before proceeding.
                </p>
              </div>
            </div>
          </div>

          {renderFields()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isGenerating}
              className="flex-1"
            >
              Go Back & Edit
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isGenerating}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isGenerating ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </span>
              ) : (
                'Looks Good - Generate Document'
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 text-center mt-3">
            Generation typically takes 15-30 seconds
          </p>
        </div>
      </div>
    </div>
  )
}
