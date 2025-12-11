'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FieldLabel } from '@/components/ui/tooltip'
import { DocumentPreview } from '@/components/ui/document-preview'
import { SignupModal } from '@/components/ui/signup-modal'
import {
  phoneSchema,
  optionalPhoneSchema,
  optionalEmailSchema,
  pastDateSchema,
  CALIFORNIA_COUNTIES,
  validationHelpers,
  formatPhoneNumber,
} from '@/lib/form-validations'

const divorceSchema = z.object({
  petitioner_name: z.string().min(2, 'Please enter your full legal name'),
  petitioner_address: z.string().min(5, 'Please enter your complete address'),
  petitioner_city: z.string().optional().or(z.literal('')),
  petitioner_zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Enter valid ZIP code (12345 or 12345-6789)').optional().or(z.literal('')),
  petitioner_phone: phoneSchema,
  petitioner_email: optionalEmailSchema,
  respondent_name: z.string().min(2, 'Please enter respondent\'s full legal name'),
  respondent_address: z.string().optional().or(z.literal('')),
  respondent_phone: optionalPhoneSchema,
  marriage_date: pastDateSchema('Marriage date'),
  marriage_location: z.string().optional().or(z.literal('')),
  separation_date: pastDateSchema('Separation date'),
  county: z.enum(CALIFORNIA_COUNTIES as unknown as [string, ...string[]], {
    errorMap: () => ({ message: 'Please select a valid California county' })
  }),
  ca_residency_duration: z.string().optional().or(z.literal('')),
  county_residency_duration: z.string().optional().or(z.literal('')),
  children: z.string().min(1, 'Please specify if there are minor children'),
  children_count: z.string().optional().or(z.literal('')),
  children_details: z.string().optional().or(z.literal('')),
  property: z.string().optional().or(z.literal('')),
  property_details: z.string().optional().or(z.literal('')),
  request_custody: z.boolean().optional(),
  request_support: z.boolean().optional(),
  request_spousal_support: z.boolean().optional(),
  request_property: z.boolean().optional(),
  request_name_change: z.boolean().optional(),
  former_name: z.string().optional().or(z.literal('')),
}).refine(
  (data) => {
    // Marriage must be before separation
    if (data.marriage_date && data.separation_date) {
      return validationHelpers.dateIsBefore(data.marriage_date, data.separation_date)
    }
    return true
  },
  {
    message: 'Separation date must be after marriage date',
    path: ['separation_date']
  }
)

type FormData = z.infer<typeof divorceSchema>

interface DivorcePetitionFormWrapperProps {
  template: {
    id: string
    name: string
  }
}

const FIELD_LABELS: Record<string, string> = {
  petitioner_name: 'Your Full Name',
  petitioner_address: 'Your Address',
  petitioner_city: 'City',
  petitioner_zip: 'ZIP Code',
  petitioner_phone: 'Your Phone',
  petitioner_email: 'Your Email',
  respondent_name: 'Respondent Full Name',
  respondent_address: 'Respondent Address',
  respondent_phone: 'Respondent Phone',
  marriage_date: 'Date of Marriage',
  marriage_location: 'Place of Marriage',
  separation_date: 'Date of Separation',
  county: 'County',
  ca_residency_duration: 'CA Residency Duration',
  county_residency_duration: 'County Residency Duration',
  children: 'Minor Children',
  children_count: 'Number of Children',
  children_details: 'Children Details',
  property: 'Community Property',
  property_details: 'Property Details',
  former_name: 'Former Name to Restore',
}

const PREVIEW_SECTIONS: Record<string, string[]> = {
  'Petitioner Information': ['petitioner_name', 'petitioner_address', 'petitioner_phone', 'petitioner_email'],
  'Respondent Information': ['respondent_name', 'respondent_address', 'respondent_phone'],
  'Marriage Details': ['marriage_date', 'marriage_location', 'separation_date', 'county'],
  'Children & Property': ['children', 'children_count', 'children_details', 'property', 'property_details'],
  'Name Change': ['former_name'],
}

const STORAGE_KEY = 'divorce_petition_draft'

export default function DivorcePetitionFormWrapper({ template }: DivorcePetitionFormWrapperProps) {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [previewData, setPreviewData] = useState<FormData | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(divorceSchema),
    defaultValues: {
      request_custody: false,
      request_support: false,
      request_spousal_support: false,
      request_property: true,
      request_name_change: false,
    }
  })

  // Auto-save to localStorage
  const formData = watch()
  useEffect(() => {
    const handler = setTimeout(() => {
      if (formData && Object.keys(formData).length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formData))
      }
    }, 1000)
    return () => clearTimeout(handler)
  }, [formData])

  // Load saved data on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        Object.keys(data).forEach((key) => {
          setValue(key as keyof FormData, data[key])
        })
      } catch (err) {
        console.error('Failed to load saved data:', err)
      }
    }
  }, [setValue])

  const onPreview = (data: FormData) => {
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
      localStorage.removeItem(STORAGE_KEY)
      router.push(`/documents/success?id=${result.document_id}`)
    } catch (err: any) {
      console.error('Generation error:', err)
      setError(err.message || 'Failed to generate document')
    } finally {
      setIsGenerating(false)
    }
  }

  const hasChildren = watch('children') === 'yes'
  const wantsNameChange = watch('request_name_change')

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <button onClick={() => router.push('/start')} className="text-blue-600 hover:text-blue-800 mb-4">
          ← Back to Templates
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{template.name}</h1>
        <p className="text-gray-600">Complete the form below to generate your petition for dissolution of marriage</p>
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
        {/* Petitioner Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Your Information (Petitioner)</h2>
          <div className="space-y-4">
            <div>
              <FieldLabel
                label="Full Legal Name"
                tooltip="Your full legal name as it appears on official documents like driver's license or birth certificate."
                required
                htmlFor="petitioner_name"
              />
              <Input id="petitioner_name" {...register('petitioner_name')} placeholder="Example: Jane Marie Smith" />
              {errors.petitioner_name && <p className="text-red-600 text-sm mt-1">{errors.petitioner_name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Street Address *</label>
              <Input {...register('petitioner_address')} placeholder="123 Main Street" />
              {errors.petitioner_address && <p className="text-red-600 text-sm mt-1">{errors.petitioner_address.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <Input {...register('petitioner_city')} placeholder="Los Angeles" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ZIP Code</label>
                <Input {...register('petitioner_zip')} placeholder="90001" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone *</label>
              <Input {...register('petitioner_phone')} type="tel" placeholder="(555) 123-4567" />
              {errors.petitioner_phone && <p className="text-red-600 text-sm mt-1">{errors.petitioner_phone.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input {...register('petitioner_email')} type="email" placeholder="jane.smith@email.com" />
            </div>
          </div>
        </div>

        {/* Respondent Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Respondent Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Legal Name *</label>
              <Input {...register('respondent_name')} placeholder="Example: John David Smith" />
              {errors.respondent_name && <p className="text-red-600 text-sm mt-1">{errors.respondent_name.message}</p>}
            </div>
            <div>
              <FieldLabel
                label="Address"
                tooltip="Respondent's current address if known. This is used for service of process."
                htmlFor="respondent_address"
              />
              <Input id="respondent_address" {...register('respondent_address')} placeholder="456 Oak Avenue, Los Angeles, CA 90001" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <Input {...register('respondent_phone')} type="tel" placeholder="(555) 987-6543" />
            </div>
          </div>
        </div>

        {/* Marriage Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Marriage Details</h2>
          <div className="space-y-4">
            <div>
              <FieldLabel
                label="Date of Marriage"
                tooltip="The date you were legally married. This establishes the duration of the marriage for property division and support purposes."
                required
                htmlFor="marriage_date"
              />
              <Input id="marriage_date" {...register('marriage_date')} type="date" />
              {errors.marriage_date && <p className="text-red-600 text-sm mt-1">{errors.marriage_date.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Place of Marriage</label>
              <Input {...register('marriage_location')} placeholder="Las Vegas, Nevada" />
            </div>
            <div>
              <FieldLabel
                label="Date of Separation"
                tooltip="The date you and your spouse separated with intent to end the marriage. This is crucial for property division - assets acquired after this date may be considered separate property."
                required
                htmlFor="separation_date"
              />
              <Input id="separation_date" {...register('separation_date')} type="date" />
              {errors.separation_date && <p className="text-red-600 text-sm mt-1">{errors.separation_date.message}</p>}
            </div>
            <div>
              <FieldLabel
                label="County for Filing"
                tooltip="The California county where you will file this petition. You must have been a resident of this county for at least 3 months."
                required
                htmlFor="county"
              />
              <Input id="county" {...register('county')} placeholder="Los Angeles, Orange, San Diego, etc." />
              {errors.county && <p className="text-red-600 text-sm mt-1">{errors.county.message}</p>}
            </div>
          </div>
        </div>

        {/* Children */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Minor Children</h2>
          <div className="space-y-4">
            <div>
              <FieldLabel
                label="Do you have minor children together?"
                tooltip="Minor children are those under 18 years old who are not yet emancipated. This affects custody, visitation, and child support orders."
                required
                htmlFor="children"
              />
              <select id="children" {...register('children')} className="w-full px-3 py-2 border border-gray-300 rounded">
                <option value="">Select...</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
              {errors.children && <p className="text-red-600 text-sm mt-1">{errors.children.message}</p>}
            </div>
            {hasChildren && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Number of Minor Children</label>
                  <Input {...register('children_count')} type="number" placeholder="2" />
                </div>
                <div>
                  <FieldLabel
                    label="Children Details"
                    tooltip="List each child's full name, date of birth, and age. This establishes jurisdiction under UCCJEA."
                    htmlFor="children_details"
                  />
                  <textarea
                    id="children_details"
                    {...register('children_details')}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    rows={3}
                    placeholder="Example:&#10;Emma Jane Smith - DOB: 05/15/2015, Age 8&#10;Noah Michael Smith - DOB: 03/20/2018, Age 5"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Property */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Community Property & Debts</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Community Property Exists?</label>
              <select {...register('property')} className="w-full px-3 py-2 border border-gray-300 rounded">
                <option value="">To be determined</option>
                <option value="yes">Yes - Property/debts to divide</option>
                <option value="no">No community property or debts</option>
              </select>
            </div>
            <div>
              <FieldLabel
                label="Property Details"
                tooltip="Briefly describe major assets and debts: real estate, vehicles, bank accounts, retirement accounts, credit cards, loans."
                htmlFor="property_details"
              />
              <textarea
                id="property_details"
                {...register('property_details')}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                rows={3}
                placeholder="Example: Family home at 123 Main St, 2 vehicles, joint bank accounts, 401k accounts, credit card debt"
              />
            </div>
          </div>
        </div>

        {/* Relief Requested */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Relief Requested</h2>
          <p className="text-sm text-gray-600 mb-4">Select what you are asking the court to order:</p>
          <div className="space-y-3">
            {hasChildren && (
              <label className="flex items-center gap-2">
                <input type="checkbox" {...register('request_custody')} className="rounded" />
                <span>Legal and physical custody orders for minor children</span>
              </label>
            )}
            {hasChildren && (
              <label className="flex items-center gap-2">
                <input type="checkbox" {...register('request_support')} className="rounded" />
                <span>Child support per California guideline</span>
              </label>
            )}
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register('request_spousal_support')} className="rounded" />
              <span>Spousal support (alimony)</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register('request_property')} className="rounded" />
              <span>Equal division of community property and debts</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register('request_name_change')} className="rounded" />
              <span>Restore former name</span>
            </label>
            {wantsNameChange && (
              <div className="ml-6 mt-2">
                <label className="block text-sm font-medium mb-1">Former Name to Restore</label>
                <Input {...register('former_name')} placeholder="Jane Marie Johnson" />
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => router.push('/start')} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" disabled={isGenerating} className="flex-1">
            Preview Document →
          </Button>
        </div>
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
            <p className="text-sm text-gray-500 mb-4">Using AI to draft a court-ready petition</p>
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
