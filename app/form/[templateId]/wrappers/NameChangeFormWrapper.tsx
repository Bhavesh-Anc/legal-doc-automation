'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DocumentPreview } from '@/components/ui/document-preview'
import { SignupModal } from '@/components/ui/signup-modal'

const STORAGE_KEY = 'name_change_draft'

// Zod validation schema
const nameChangeSchema = z.object({
  // Current Information
  current_legal_name: z.string().min(2, 'Please enter your current full legal name'),
  current_first_name: z.string().min(1, 'Please enter your current first name'),
  current_middle_name: z.string().optional().or(z.literal('')),
  current_last_name: z.string().min(1, 'Please enter your current last name'),

  // Name to Restore
  name_to_restore: z.string().min(2, 'Please enter the name you want to restore'),
  restore_first_name: z.string().min(1, 'Please enter the first name to restore'),
  restore_middle_name: z.string().optional().or(z.literal('')),
  restore_last_name: z.string().min(1, 'Please enter the last name to restore'),

  // Contact Information
  address: z.string().min(5, 'Please enter your complete address'),
  city: z.string().min(2, 'Please enter your city'),
  state: z.string().default('California'),
  zip: z.string().min(5, 'Please enter your ZIP code'),
  phone: z.string().min(10, 'Please enter your phone number'),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),

  // Case Information
  divorce_case_number: z.string().min(1, 'Please enter your divorce case number'),
  county: z.string().min(1, 'Please select the county where divorce was filed'),
  marriage_date: z.string().min(1, 'Please enter your marriage date'),
  divorce_finalized_date: z.string().min(1, 'Please enter when your divorce was finalized'),

  // Reason for Name Change
  reason: z.string().min(10, 'Please explain why you are changing your name'),

  // Former Spouse Information (optional)
  former_spouse_name: z.string().optional().or(z.literal('')),

  // Additional Details
  other_names_used: z.string().optional().or(z.literal('')),
  criminal_history: z.enum(['no', 'yes']).default('no'),
  bankruptcy_history: z.enum(['no', 'yes']).default('no'),

  // Declaration
  declare_under_penalty: z.boolean().refine((val) => val === true, {
    message: 'You must declare under penalty of perjury'
  }),
})

type NameChangeFormData = z.infer<typeof nameChangeSchema>

interface NameChangeFormWrapperProps {
  template: {
    id: string
    name: string
  }
}

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

export function NameChangeFormWrapper({ template }: NameChangeFormWrapperProps) {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [previewData, setPreviewData] = useState<NameChangeFormData | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm<NameChangeFormData>({
    resolver: zodResolver(nameChangeSchema),
    defaultValues: {
      state: 'California',
      criminal_history: 'no',
      bankruptcy_history: 'no',
    },
  })

  // Auto-save to localStorage
  useEffect(() => {
    const subscription = watch((data) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    })
    return () => subscription.unsubscribe()
  }, [watch])

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        Object.keys(data).forEach((key) => {
          setValue(key as keyof NameChangeFormData, data[key])
        })
      } catch (err) {
        console.error('Failed to load saved data:', err)
      }
    }
  }, [setValue])

  const onPreview = (data: NameChangeFormData) => {
    setPreviewData(data)
    setShowPreview(true)
  }

  const handleGenerateClick = async () => {
    setShowPreview(false)
    setShowSignupModal(true)
  }

  const handleSignupSuccess = async (userId: string) => {
    if (!previewData) return

    setShowSignupModal(false)
    setIsGenerating(true)
    setError(null)

    try {
      // Wait for session cookies to be set
      router.refresh()
      await new Promise(resolve => setTimeout(resolve, 1000))

      const response = await fetch('/api/generate-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: template.id,
          form_data: previewData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate document')
      }

      const result = await response.json()

      // Clear saved draft
      localStorage.removeItem(STORAGE_KEY)

      // Redirect to success page
      router.push(`/documents/success?id=${result.document_id}`)
    } catch (err: any) {
      console.error('Generation error:', err)
      setError(err.message || 'Failed to generate document')
    } finally {
      setIsGenerating(false)
    }
  }

  const hasCriminalHistory = watch('criminal_history') === 'yes'
  const hasBankruptcy = watch('bankruptcy_history') === 'yes'

  const FIELD_LABELS: Record<string, string> = {
    current_legal_name: 'Current Legal Name',
    name_to_restore: 'Name to Restore',
    county: 'County',
    divorce_case_number: 'Case Number',
  }

  const PREVIEW_SECTIONS: Record<string, string[]> = {
    'Current Name': ['current_legal_name', 'current_first_name', 'current_middle_name', 'current_last_name'],
    'Name to Restore': ['name_to_restore', 'restore_first_name', 'restore_middle_name', 'restore_last_name'],
    'Contact Information': ['address', 'city', 'state', 'zip', 'phone', 'email'],
    'Case Details': ['divorce_case_number', 'county', 'marriage_date', 'divorce_finalized_date'],
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <button
          onClick={() => router.push('/start')}
          className="text-blue-600 hover:text-blue-800 mb-4"
        >
          ← Back to Templates
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{template.name}</h1>
        <p className="text-gray-600">Complete the form below to restore your former name</p>
        <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-sm text-green-800">
            <strong>No signup required!</strong> Fill out the form first, create account when ready
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

    <form onSubmit={handleSubmit(onPreview)} className="space-y-8">
      {/* Header */}
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Name Change After Divorce (FL-395)</h2>
        <p className="text-sm text-gray-600 mt-2">
          Restore your former/maiden name after divorce finalization. This form requests the court to grant your name change.
        </p>
      </div>

      {/* Important Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">📋 What You'll Need</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Your divorce case number</li>
          <li>Date your divorce was finalized</li>
          <li>The exact name you want to restore to (usually maiden name)</li>
          <li>Your current legal name</li>
        </ul>
      </div>

      {/* Section 1: Current Legal Name */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">1. Current Legal Name</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Current Full Legal Name <span className="text-red-500">*</span>
          </label>
          <Input
            {...register('current_legal_name')}
            placeholder="Jane Marie Smith"
            className={errors.current_legal_name ? 'border-red-500' : ''}
          />
          {errors.current_legal_name && (
            <p className="text-red-500 text-sm mt-1">{errors.current_legal_name.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name <span className="text-red-500">*</span>
            </label>
            <Input
              {...register('current_first_name')}
              placeholder="Jane"
              className={errors.current_first_name ? 'border-red-500' : ''}
            />
            {errors.current_first_name && (
              <p className="text-red-500 text-sm mt-1">{errors.current_first_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Middle Name
            </label>
            <Input {...register('current_middle_name')} placeholder="Marie" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name <span className="text-red-500">*</span>
            </label>
            <Input
              {...register('current_last_name')}
              placeholder="Smith"
              className={errors.current_last_name ? 'border-red-500' : ''}
            />
            {errors.current_last_name && (
              <p className="text-red-500 text-sm mt-1">{errors.current_last_name.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Section 2: Name to Restore */}
      <div className="space-y-4 bg-green-50 p-6 rounded-lg border border-green-200">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-green-300 pb-2">
          2. Name You Want to Restore
        </h3>
        <p className="text-sm text-green-800">
          This is typically your maiden name or the name you had before marriage.
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name to Restore <span className="text-red-500">*</span>
          </label>
          <Input
            {...register('name_to_restore')}
            placeholder="Jane Marie Johnson"
            className={errors.name_to_restore ? 'border-red-500' : ''}
          />
          {errors.name_to_restore && (
            <p className="text-red-500 text-sm mt-1">{errors.name_to_restore.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name <span className="text-red-500">*</span>
            </label>
            <Input
              {...register('restore_first_name')}
              placeholder="Jane"
              className={errors.restore_first_name ? 'border-red-500' : ''}
            />
            {errors.restore_first_name && (
              <p className="text-red-500 text-sm mt-1">{errors.restore_first_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Middle Name
            </label>
            <Input {...register('restore_middle_name')} placeholder="Marie" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name <span className="text-red-500">*</span>
            </label>
            <Input
              {...register('restore_last_name')}
              placeholder="Johnson"
              className={errors.restore_last_name ? 'border-red-500' : ''}
            />
            {errors.restore_last_name && (
              <p className="text-red-500 text-sm mt-1">{errors.restore_last_name.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Contact Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">3. Your Contact Information</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Street Address <span className="text-red-500">*</span>
          </label>
          <Input
            {...register('address')}
            placeholder="123 Main Street, Apt 4B"
            className={errors.address ? 'border-red-500' : ''}
          />
          {errors.address && (
            <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City <span className="text-red-500">*</span>
            </label>
            <Input
              {...register('city')}
              placeholder="Los Angeles"
              className={errors.city ? 'border-red-500' : ''}
            />
            {errors.city && (
              <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State
            </label>
            <Input {...register('state')} value="California" disabled className="bg-gray-100" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ZIP Code <span className="text-red-500">*</span>
            </label>
            <Input
              {...register('zip')}
              placeholder="90001"
              className={errors.zip ? 'border-red-500' : ''}
            />
            {errors.zip && (
              <p className="text-red-500 text-sm mt-1">{errors.zip.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <Input
              {...register('phone')}
              type="tel"
              placeholder="(555) 123-4567"
              className={errors.phone ? 'border-red-500' : ''}
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <Input
              {...register('email')}
              type="email"
              placeholder="jane@example.com"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Section 4: Divorce Case Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">4. Divorce Case Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Divorce Case Number <span className="text-red-500">*</span>
            </label>
            <Input
              {...register('divorce_case_number')}
              placeholder="FL-2024-12345"
              className={errors.divorce_case_number ? 'border-red-500' : ''}
            />
            {errors.divorce_case_number && (
              <p className="text-red-500 text-sm mt-1">{errors.divorce_case_number.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Found on your divorce judgment or petition
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              County <span className="text-red-500">*</span>
            </label>
            <select
              {...register('county')}
              className={`w-full rounded-md border ${errors.county ? 'border-red-500' : 'border-gray-300'} px-3 py-2`}
            >
              <option value="">Select County</option>
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Marriage Date <span className="text-red-500">*</span>
            </label>
            <Input
              {...register('marriage_date')}
              type="date"
              className={errors.marriage_date ? 'border-red-500' : ''}
            />
            {errors.marriage_date && (
              <p className="text-red-500 text-sm mt-1">{errors.marriage_date.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Divorce Finalized Date <span className="text-red-500">*</span>
            </label>
            <Input
              {...register('divorce_finalized_date')}
              type="date"
              className={errors.divorce_finalized_date ? 'border-red-500' : ''}
            />
            {errors.divorce_finalized_date && (
              <p className="text-red-500 text-sm mt-1">{errors.divorce_finalized_date.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Date on your final divorce judgment
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Former Spouse's Name (Optional)
          </label>
          <Input
            {...register('former_spouse_name')}
            placeholder="John Smith"
          />
        </div>
      </div>

      {/* Section 5: Reason for Name Change */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">5. Reason for Name Change</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Why are you requesting this name change? <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register('reason')}
            rows={4}
            className={`w-full rounded-md border ${errors.reason ? 'border-red-500' : 'border-gray-300'} px-3 py-2`}
            placeholder="I wish to restore my former name following my divorce. I was previously known as Jane Johnson before my marriage and would like to resume using that name for personal and professional reasons."
          />
          {errors.reason && (
            <p className="text-red-500 text-sm mt-1">{errors.reason.message}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Common reasons: restore maiden name, professional identity, personal preference
          </p>
        </div>
      </div>

      {/* Section 6: Additional Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">6. Additional Information</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Other Names You've Used (Optional)
          </label>
          <textarea
            {...register('other_names_used')}
            rows={2}
            className="w-full rounded-md border border-gray-300 px-3 py-2"
            placeholder="List any other names, aliases, or nicknames you've been known by"
          />
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Criminal History <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="radio" {...register('criminal_history')} value="no" />
                <span className="text-sm">No criminal history</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" {...register('criminal_history')} value="yes" />
                <span className="text-sm">Yes, I have a criminal history</span>
              </label>
            </div>
            {hasCriminalHistory && (
              <p className="text-sm text-amber-700 mt-2 p-3 bg-amber-50 rounded border border-amber-200">
                ⚠️ Having a criminal history doesn't automatically prevent a name change, but you may need to provide additional documentation. Consult with an attorney if you have concerns.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bankruptcy History <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="radio" {...register('bankruptcy_history')} value="no" />
                <span className="text-sm">No bankruptcy history</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" {...register('bankruptcy_history')} value="yes" />
                <span className="text-sm">Yes, I have filed for bankruptcy</span>
              </label>
            </div>
            {hasBankruptcy && (
              <p className="text-sm text-amber-700 mt-2 p-3 bg-amber-50 rounded border border-amber-200">
                ℹ️ If you have an active bankruptcy case, you may need court approval before changing your name.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Section 7: Declaration */}
      <div className="space-y-4 bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-300 pb-2">
          7. Declaration Under Penalty of Perjury
        </h3>

        <div className="bg-white p-4 rounded border border-gray-300">
          <p className="text-sm text-gray-700 mb-4">
            I declare under penalty of perjury under the laws of the State of California that the information provided in this form is true and correct to the best of my knowledge.
          </p>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              {...register('declare_under_penalty')}
              className="mt-1"
            />
            <span className="text-sm font-medium">
              I declare under penalty of perjury that the foregoing is true and correct <span className="text-red-500">*</span>
            </span>
          </label>
          {errors.declare_under_penalty && (
            <p className="text-red-500 text-sm mt-2">{errors.declare_under_penalty.message}</p>
          )}
        </div>
      </div>

      {/* Important Information */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Important Information</h3>
        <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
          <li>This form must be filed with the same court that handled your divorce</li>
          <li>There is typically no filing fee for name change after divorce (check with your county)</li>
          <li>You'll need to update your name with Social Security, DMV, banks, employers, etc. after approval</li>
          <li>The court may require a certified copy of your divorce judgment</li>
          <li>Processing time varies by county (typically 4-8 weeks)</li>
        </ul>
      </div>

      {/* Submit Button */}
      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/start')}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isGenerating} className="flex-1">
          Preview Document →
        </Button>
      </div>

      {/* Auto-save indicator */}
      <p className="text-xs text-gray-500 text-center">
        ✓ Your progress is automatically saved
      </p>
    </form>

    <DocumentPreview
      isOpen={showPreview}
      onClose={() => setShowPreview(false)}
      onConfirm={handleGenerateClick}
      templateName={template.name}
      formData={previewData || {}}
      fieldLabels={FIELD_LABELS}
      sections={PREVIEW_SECTIONS}
    />

    <SignupModal
      isOpen={showSignupModal}
      onClose={() => setShowSignupModal(false)}
      onSuccess={handleSignupSuccess}
      templateName={template.name}
    />

    {isGenerating && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Generating Your Document...</h3>
          <p className="text-gray-700 mb-1">Creating your {template.name}</p>
          <p className="text-sm text-gray-500 mb-4">Using AI to draft your name change form</p>
          <p className="text-xs text-gray-400">This usually takes 15-30 seconds</p>
          <div className="flex justify-center gap-1 mt-4">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    )}
    </div>
  )
}
