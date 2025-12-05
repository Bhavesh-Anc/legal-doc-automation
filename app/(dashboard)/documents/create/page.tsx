'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateDocumentPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    petitioner_name: '',
    respondent_name: '',
    marriage_date: '',
    separation_date: '',
    county: '',
    children: false,
    property: false,
  })

  const CALIFORNIA_COUNTIES = [
    'Alameda', 'Los Angeles', 'Orange', 'Riverside', 'Sacramento',
    'San Bernardino', 'San Diego', 'San Francisco', 'Santa Clara'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/generate-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: 'divorce-petition-ca',
          form_data: formData,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate document')
      }

      router.push(`/dashboard/documents/${result.document_id}`)
    } catch (err: any) {
      setError(err.message)
      setIsGenerating(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-2">California Divorce Petition</h1>
      <p className="text-gray-600 mb-8">Generate your divorce petition in minutes</p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium mb-2">Your Full Name</label>
          <input
            type="text"
            required
            value={formData.petitioner_name}
            onChange={(e) => setFormData({...formData, petitioner_name: e.target.value})}
            className="w-full border border-gray-300 rounded-lg p-3"
            placeholder="Jane Smith"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Spouse's Full Name</label>
          <input
            type="text"
            required
            value={formData.respondent_name}
            onChange={(e) => setFormData({...formData, respondent_name: e.target.value})}
            className="w-full border border-gray-300 rounded-lg p-3"
            placeholder="John Smith"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Date of Marriage</label>
          <input
            type="date"
            required
            value={formData.marriage_date}
            onChange={(e) => setFormData({...formData, marriage_date: e.target.value})}
            className="w-full border border-gray-300 rounded-lg p-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Date of Separation</label>
          <input
            type="date"
            required
            value={formData.separation_date}
            onChange={(e) => setFormData({...formData, separation_date: e.target.value})}
            className="w-full border border-gray-300 rounded-lg p-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">County</label>
          <select
            required
            value={formData.county}
            onChange={(e) => setFormData({...formData, county: e.target.value})}
            className="w-full border border-gray-300 rounded-lg p-3"
          >
            <option value="">Select County</option>
            {CALIFORNIA_COUNTIES.map((county) => (
              <option key={county} value={county}>{county}</option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.children}
              onChange={(e) => setFormData({...formData, children: e.target.checked})}
              className="mr-3 h-5 w-5"
            />
            <span className="text-sm">We have minor children together</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.property}
              onChange={(e) => setFormData({...formData, property: e.target.checked})}
              className="mr-3 h-5 w-5"
            />
            <span className="text-sm">We have community property or debts</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={isGenerating}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {isGenerating ? 'Generating...' : 'Generate Document'}
        </button>
      </form>
    </div>
  )
}
