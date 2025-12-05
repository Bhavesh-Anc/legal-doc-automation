'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const divorcePetitionSchema = z.object({
  petitioner_name: z.string().min(1, 'Petitioner name is required'),
  respondent_name: z.string().min(1, 'Respondent name is required'),
  marriage_date: z.string().min(1, 'Marriage date is required'),
  separation_date: z.string().min(1, 'Separation date is required'),
  county: z.string().min(1, 'County is required'),
  children: z.boolean().default(false),
  property: z.boolean().default(false),
})

type FormData = z.infer<typeof divorcePetitionSchema>

const CALIFORNIA_COUNTIES = [
  'Alameda', 'Alpine', 'Amador', 'Butte', 'Calaveras', 'Colusa', 'Contra Costa',
  'Del Norte', 'El Dorado', 'Fresno', 'Glenn', 'Humboldt', 'Imperial', 'Inyo',
  'Kern', 'Kings', 'Lake', 'Lassen', 'Los Angeles', 'Madera', 'Marin', 'Mariposa',
  'Mendocino', 'Merced', 'Modoc', 'Mono', 'Monterey', 'Napa', 'Nevada', 'Orange',
  'Placer', 'Plumas', 'Riverside', 'Sacramento', 'San Benito', 'San Bernardino',
  'San Diego', 'San Francisco', 'San Joaquin', 'San Luis Obispo', 'San Mateo',
  'Santa Barbara', 'Santa Clara', 'Santa Cruz', 'Shasta', 'Sierra', 'Siskiyou',
  'Solano', 'Sonoma', 'Stanislaus', 'Sutter', 'Tehama', 'Trinity', 'Tulare',
  'Tuolumne', 'Ventura', 'Yolo', 'Yuba'
]

export default function NewDocumentPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<FormData>({
    resolver: zodResolver(divorcePetitionSchema),
    defaultValues: {
      children: false,
      property: false,
    }
  })

  const formData = watch()

  const onSubmit = async (data: FormData) => {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/generate-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: 'divorce-petition-ca',
          form_data: data,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        // Better error messages for common issues
        if (result.error?.includes('quota') || result.error?.includes('429')) {
          throw new Error('OpenAI API quota exceeded. Please add credits to your OpenAI account or contact support.')
        } else if (result.error?.includes('storage') || result.error?.includes('upload')) {
          throw new Error('Failed to save document. Please check your storage permissions and try again.')
        } else {
          throw new Error(result.error || 'Failed to generate document')
        }
      }

      // Redirect to document view
      router.push(`/documents/${result.document_id}`)
    } catch (err: any) {
      console.error('Document generation error:', err)
      setError(err.message)
      setIsGenerating(false)
    }
  }

  const nextStep = () => {
    setStep(step + 1)
  }

  const prevStep = () => {
    setStep(step - 1)
  }

  return (
    <div className="max-w-3xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">California Divorce Petition (FL-100)</h1>
        <p className="text-gray-600">
          Complete the form below to generate your petition for dissolution of marriage
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex items-center justify-center w-10 h-10 rounded-full ${
                s <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}
            >
              {s}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Party Info</span>
          <span>Details</span>
          <span>Review</span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1: Party Information */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Party Information</h2>

            <div>
              <label className="block text-sm font-medium mb-2">
                Your Full Legal Name (Petitioner)
              </label>
              <Input
                {...register('petitioner_name')}
                placeholder="Jane Smith"
                className={errors.petitioner_name ? 'border-red-500' : ''}
              />
              {errors.petitioner_name && (
                <p className="text-red-500 text-sm mt-1">{errors.petitioner_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Spouse's Full Legal Name (Respondent)
              </label>
              <Input
                {...register('respondent_name')}
                placeholder="John Smith"
                className={errors.respondent_name ? 'border-red-500' : ''}
              />
              {errors.respondent_name && (
                <p className="text-red-500 text-sm mt-1">{errors.respondent_name.message}</p>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="button" onClick={nextStep}>
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Marriage Details */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Marriage & Residency Details</h2>

            <div>
              <label className="block text-sm font-medium mb-2">
                Date of Marriage
              </label>
              <Input
                type="date"
                {...register('marriage_date')}
                className={errors.marriage_date ? 'border-red-500' : ''}
              />
              {errors.marriage_date && (
                <p className="text-red-500 text-sm mt-1">{errors.marriage_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Date of Separation
              </label>
              <Input
                type="date"
                {...register('separation_date')}
                className={errors.separation_date ? 'border-red-500' : ''}
              />
              {errors.separation_date && (
                <p className="text-red-500 text-sm mt-1">{errors.separation_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                County Where Filing
              </label>
              <select
                {...register('county')}
                className={`w-full border rounded-lg p-3 ${errors.county ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Select a county</option>
                {CALIFORNIA_COUNTIES.map((county) => (
                  <option key={county} value={county}>
                    {county}
                  </option>
                ))}
              </select>
              {errors.county && (
                <p className="text-red-500 text-sm mt-1">{errors.county.message}</p>
              )}
            </div>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('children')}
                  className="mr-3 h-5 w-5 text-blue-600"
                />
                <span className="text-sm">We have minor children together</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('property')}
                  className="mr-3 h-5 w-5 text-blue-600"
                />
                <span className="text-sm">We have community property or debts</span>
              </label>
            </div>

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={prevStep}>
                Back
              </Button>
              <Button type="button" onClick={nextStep}>
                Review
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Generate */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Review Your Information</h2>

            <div className="bg-gray-50 rounded-lg p-6 space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">Petitioner:</span>
                <span>{formData.petitioner_name}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">Respondent:</span>
                <span>{formData.respondent_name}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">Marriage Date:</span>
                <span>{formData.marriage_date}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">Separation Date:</span>
                <span>{formData.separation_date}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">County:</span>
                <span>{formData.county}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium">Minor Children:</span>
                <span>{formData.children ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Community Property:</span>
                <span>{formData.property ? 'Yes' : 'No'}</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This will generate a draft divorce petition. Please review
                the generated document carefully and consult with an attorney before filing.
              </p>
            </div>

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={prevStep} disabled={isGenerating}>
                Back
              </Button>
              <Button type="submit" disabled={isGenerating}>
                {isGenerating ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </span>
                ) : (
                  'Generate Document'
                )}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
