'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FieldLabel } from '@/components/ui/tooltip'

// Enhanced validation schema
const divorcePetitionSchema = z.object({
  // Party Information
  petitioner_name: z.string()
    .min(2, 'Please enter your full legal name (at least 2 characters)')
    .max(100, 'Name is too long (maximum 100 characters)')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes (no numbers or special characters)'),
  petitioner_address: z.string().min(5, 'Please enter your complete street address'),
  petitioner_city: z.string().min(2, 'Please enter your city'),
  petitioner_zip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code (e.g., 90001 or 90001-1234)'),
  petitioner_phone: z.string()
    .regex(/^[\d\s\-\(\)]+$/, 'Please enter a valid phone number using only digits, spaces, dashes, and parentheses')
    .optional()
    .or(z.literal('')),
  petitioner_email: z.string().email('Please enter a valid email address (e.g., name@example.com)').optional().or(z.literal('')),

  respondent_name: z.string()
    .min(2, 'Please enter your spouse\'s full legal name (at least 2 characters)')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes (no numbers or special characters)'),
  respondent_address: z.string().optional(),
  respondent_phone: z.string().optional().or(z.literal('')),

  // Marriage Details
  marriage_date: z.string().min(1, 'Please enter the date of marriage'),
  marriage_location: z.string().optional().or(z.literal('')),
  separation_date: z.string().min(1, 'Please enter the date when you began living separate and apart'),
  county: z.string().min(1, 'Please select the California county where you will file'),
  ca_residency_duration: z.string().min(1, 'Please select how long you or your spouse have lived in California'),
  county_residency_duration: z.string().min(1, 'Please select how long you or your spouse have lived in this county'),

  // Children
  children: z.boolean().default(false),
  children_count: z.string().optional().or(z.literal('')),
  children_details: z.string().optional().or(z.literal('')),
  custody_preference: z.string().optional().or(z.literal('')),

  // Property
  property: z.boolean().default(false),
  property_details: z.string().optional().or(z.literal('')),

  // Relief Requested
  request_custody: z.boolean().default(false),
  request_support: z.boolean().default(false),
  request_spousal_support: z.boolean().default(false),
  request_property: z.boolean().default(false),
  request_name_change: z.boolean().default(false),
  former_name: z.string().optional().or(z.literal('')),

  // Additional
  attorney_name: z.string().optional().or(z.literal('')),
  attorney_bar_number: z.string().optional().or(z.literal('')),
  prior_cases: z.string().optional().or(z.literal('')),
}).refine((data) => {
  const marriage = new Date(data.marriage_date)
  const separation = new Date(data.separation_date)
  return separation >= marriage
}, {
  message: 'Separation date must be on or after the marriage date. Please check your dates and try again.',
  path: ['separation_date']
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

interface DivorcePetitionFormProps {
  template: {
    id: string
    name: string
    description?: string | null
    category?: string
    state?: string
    form_schema?: any
  }
}

export default function DivorcePetitionForm({ template }: DivorcePetitionFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [draftSaved, setDraftSaved] = useState(false)

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
      request_custody: false,
      request_support: false,
      request_spousal_support: false,
      request_property: false,
      request_name_change: false,
    }
  })

  const formData = watch()
  const showChildrenFields = watch('children')
  const showPropertyFields = watch('property')

  // Load saved draft on mount
  useEffect(() => {
    const savedData = localStorage.getItem(`${template.id}-draft`)
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        Object.keys(parsed).forEach((key) => {
          setValue(key as any, parsed[key])
        })
        setDraftSaved(true)
      } catch (e) {
        console.error('Failed to load draft:', e)
      }
    }
  }, [setValue])

  // Auto-save draft
  useEffect(() => {
    const subscription = watch((data) => {
      try {
        localStorage.setItem(`${template.id}-draft`, JSON.stringify(data))
        setDraftSaved(true)
        setTimeout(() => setDraftSaved(false), 2000)
      } catch (e) {
        console.error('Failed to save draft:', e)
      }
    })
    return () => subscription.unsubscribe()
  }, [watch])

  const clearDraft = () => {
    if (confirm('Are you sure you want to clear your saved progress?')) {
      localStorage.removeItem(`${template.id}-draft`)
      router.refresh()
    }
  }

  const onSubmit = async (data: FormData) => {
    setIsGenerating(true)
    setError(null)
    setGenerationProgress('Preparing your document...')

    try {
      setTimeout(() => setGenerationProgress('Analyzing information...'), 1000)
      setTimeout(() => setGenerationProgress('Generating legal text with AI...'), 3000)
      setTimeout(() => setGenerationProgress('Creating DOCX file...'), 8000)

      const response = await fetch('/api/generate-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: template.id,
          form_data: data,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.error?.includes('quota') || result.error?.includes('429')) {
          throw new Error('OpenAI API quota exceeded. Please add credits to your OpenAI account or contact support.')
        } else if (result.error?.includes('storage') || result.error?.includes('upload')) {
          throw new Error('Failed to save document. Please check your storage permissions and try again.')
        } else {
          throw new Error(result.error || 'Failed to generate document')
        }
      }

      setGenerationProgress('Upload complete!')

      // Clear draft on success
      localStorage.removeItem(`${template.id}-draft`)

      // Redirect to success page
      router.push(`/documents/success?id=${result.document_id}`)
    } catch (err: any) {
      console.error('Document generation error:', err)
      setError(err.message)
      setIsGenerating(false)
      setGenerationProgress('')
    }
  }

  const nextStep = () => {
    setStep(step + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const prevStep = () => {
    setStep(step - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">California Divorce Petition (FL-100)</h1>
            <p className="text-gray-600">
              Complete the form below to generate your petition for dissolution of marriage
            </p>
          </div>
          {draftSaved && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Draft saved
            </div>
          )}
        </div>

        <button
          onClick={clearDraft}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Clear saved progress
        </button>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                  s <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {s < step ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  s
                )}
              </div>
              {s < 4 && (
                <div className={`flex-1 h-1 mx-2 rounded ${s < step ? 'bg-blue-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span className="flex-1 text-center">Party Info</span>
          <span className="flex-1 text-center">Details</span>
          <span className="flex-1 text-center">Relief</span>
          <span className="flex-1 text-center">Review</span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-600 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-red-600 text-sm font-medium">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1: Party Information */}
        {step === 1 && (
          <div className="space-y-6 bg-white p-8 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-6">Party Information</h2>

            {/* Petitioner Section */}
            <div className="space-y-4 pb-6 border-b">
              <h3 className="font-medium text-gray-900">Your Information (Petitioner)</h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <FieldLabel
                    label="Your Full Legal Name"
                    tooltip="Enter your full legal name exactly as it appears on your driver's license, birth certificate, or other official documents. This is the name that will appear on the divorce petition as the 'Petitioner' (the person filing for divorce)."
                    required
                    htmlFor="petitioner_name"
                  />
                  <Input
                    id="petitioner_name"
                    {...register('petitioner_name')}
                    placeholder="Jane Doe Smith"
                    className={errors.petitioner_name ? 'border-red-500' : ''}
                  />
                  {errors.petitioner_name && (
                    <p className="text-red-500 text-xs mt-1">{errors.petitioner_name.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <FieldLabel
                    label="Street Address"
                    tooltip="Your current residential address. This address will be used for court notifications and service of documents. If you have safety concerns, consult an attorney about using a P.O. Box or alternative address."
                    required
                    htmlFor="petitioner_address"
                  />
                  <Input
                    id="petitioner_address"
                    {...register('petitioner_address')}
                    placeholder="123 Main Street"
                    className={errors.petitioner_address ? 'border-red-500' : ''}
                  />
                  {errors.petitioner_address && (
                    <p className="text-red-500 text-xs mt-1">{errors.petitioner_address.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">City *</label>
                  <Input
                    {...register('petitioner_city')}
                    placeholder="Los Angeles"
                    className={errors.petitioner_city ? 'border-red-500' : ''}
                  />
                  {errors.petitioner_city && (
                    <p className="text-red-500 text-xs mt-1">{errors.petitioner_city.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">ZIP Code *</label>
                  <Input
                    {...register('petitioner_zip')}
                    placeholder="90001"
                    className={errors.petitioner_zip ? 'border-red-500' : ''}
                  />
                  {errors.petitioner_zip && (
                    <p className="text-red-500 text-xs mt-1">{errors.petitioner_zip.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Phone Number
                    <span className="text-gray-400 text-xs ml-1">(optional)</span>
                  </label>
                  <Input
                    type="tel"
                    {...register('petitioner_phone')}
                    placeholder="(555) 123-4567"
                    className={errors.petitioner_phone ? 'border-red-500' : ''}
                  />
                  {errors.petitioner_phone && (
                    <p className="text-red-500 text-xs mt-1">{errors.petitioner_phone.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email Address
                    <span className="text-gray-400 text-xs ml-1">(optional)</span>
                  </label>
                  <Input
                    type="email"
                    {...register('petitioner_email')}
                    placeholder="jane@example.com"
                    className={errors.petitioner_email ? 'border-red-500' : ''}
                  />
                  {errors.petitioner_email && (
                    <p className="text-red-500 text-xs mt-1">{errors.petitioner_email.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Respondent Section */}
            <div className="space-y-4 pt-6">
              <h3 className="font-medium text-gray-900">Spouse's Information (Respondent)</h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <FieldLabel
                    label="Spouse's Full Legal Name"
                    tooltip="Enter your spouse's full legal name exactly as it appears on official documents. This is the name that will appear on the divorce petition as the 'Respondent' (the person responding to the divorce filing). Use their current legal name, even if they go by a nickname."
                    required
                    htmlFor="respondent_name"
                  />
                  <Input
                    id="respondent_name"
                    {...register('respondent_name')}
                    placeholder="John Smith"
                    className={errors.respondent_name ? 'border-red-500' : ''}
                  />
                  {errors.respondent_name && (
                    <p className="text-red-500 text-xs mt-1">{errors.respondent_name.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Spouse's Address
                    <span className="text-gray-400 text-xs ml-1">(if known)</span>
                  </label>
                  <Input
                    {...register('respondent_address')}
                    placeholder="456 Oak Avenue, Los Angeles, CA 90001"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Provide if you know where your spouse currently lives
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Spouse's Phone Number
                    <span className="text-gray-400 text-xs ml-1">(optional)</span>
                  </label>
                  <Input
                    type="tel"
                    {...register('respondent_phone')}
                    placeholder="(555) 987-6543"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <Button type="button" onClick={nextStep} size="lg">
                Next: Marriage Details
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Marriage & Residency Details */}
        {step === 2 && (
          <div className="space-y-6 bg-white p-8 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-6">Marriage & Residency Details</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Date of Marriage *
                </label>
                <Input
                  type="date"
                  {...register('marriage_date')}
                  className={errors.marriage_date ? 'border-red-500' : ''}
                />
                {errors.marriage_date && (
                  <p className="text-red-500 text-xs mt-1">{errors.marriage_date.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Where were you married?
                  <span className="text-gray-400 text-xs ml-1">(optional)</span>
                </label>
                <Input
                  {...register('marriage_location')}
                  placeholder="Las Vegas, Nevada"
                />
                <p className="text-xs text-gray-500 mt-1">City and State</p>
              </div>

              <div className="md:col-span-2">
                <FieldLabel
                  label="Date of Separation"
                  tooltip="The date when you and your spouse began living separate and apart with the intent to end your marriage. This can be while still living in the same house if you stopped acting as a married couple. This date is CRITICAL as it determines when community property stops accruing and affects support duration. Must be after the marriage date."
                  required
                  htmlFor="separation_date"
                />
                <Input
                  id="separation_date"
                  type="date"
                  {...register('separation_date')}
                  className={errors.separation_date ? 'border-red-500' : ''}
                />
                {errors.separation_date && (
                  <p className="text-red-500 text-xs mt-1">{errors.separation_date.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  This is when you stopped living together as a married couple, even if you still lived in the same house
                </p>
              </div>

              <div className="md:col-span-2">
                <FieldLabel
                  label="County Where Filing"
                  tooltip="The California county where you will file your divorce petition. This must be a county where you OR your spouse has lived for at least 3 months immediately before filing. Typically, choose the county where you currently reside. The case will be heard in this county's Superior Court."
                  required
                  htmlFor="county"
                />
                <select
                  id="county"
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
                  <p className="text-red-500 text-xs mt-1">{errors.county.message}</p>
                )}
              </div>

              <div>
                <FieldLabel
                  label="How long in California?"
                  tooltip="MANDATORY JURISDICTIONAL REQUIREMENT: You or your spouse must have been a California resident for at least 6 months immediately before filing for divorce (per Family Code § 2320). If you haven't met this requirement yet, you must wait. California courts have NO jurisdiction to grant a divorce without this 6-month residency."
                  required
                  htmlFor="ca_residency_duration"
                />
                <select
                  id="ca_residency_duration"
                  {...register('ca_residency_duration')}
                  className={`w-full border rounded-lg p-3 ${errors.ca_residency_duration ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select duration</option>
                  <option value="less_than_6_months">Less than 6 months</option>
                  <option value="6_to_12_months">6-12 months</option>
                  <option value="over_1_year">Over 1 year</option>
                </select>
                {errors.ca_residency_duration && (
                  <p className="text-red-500 text-xs mt-1">{errors.ca_residency_duration.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Must be 6+ months to file in California
                </p>
              </div>

              <div>
                <FieldLabel
                  label="How long in this county?"
                  tooltip="MANDATORY JURISDICTIONAL REQUIREMENT: You or your spouse must have been a resident of the county where you're filing for at least 3 months immediately before filing (per Family Code § 2320). This determines which county's Superior Court will handle your case. If you recently moved, you may need to wait."
                  required
                  htmlFor="county_residency_duration"
                />
                <select
                  id="county_residency_duration"
                  {...register('county_residency_duration')}
                  className={`w-full border rounded-lg p-3 ${errors.county_residency_duration ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select duration</option>
                  <option value="less_than_3_months">Less than 3 months</option>
                  <option value="3_to_6_months">3-6 months</option>
                  <option value="over_6_months">Over 6 months</option>
                </select>
                {errors.county_residency_duration && (
                  <p className="text-red-500 text-xs mt-1">{errors.county_residency_duration.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Must be 3+ months in this county
                </p>
              </div>
            </div>

            {/* Children Section */}
            <div className="space-y-4 pt-6 border-t">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('children')}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <span className="text-sm font-medium">We have minor children together (under 18)</span>
              </label>

              {showChildrenFields && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200 mt-4">
                  <h3 className="font-semibold text-blue-900">Children Information</h3>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Number of Minor Children
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="20"
                      {...register('children_count')}
                      placeholder="2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Children Details (names, ages, birthdates)
                    </label>
                    <textarea
                      {...register('children_details')}
                      className="w-full border border-gray-300 rounded-lg p-3 min-h-[120px]"
                      placeholder="Example:&#10;1. Emily Smith, 10 years old, born January 15, 2015&#10;2. Michael Smith, 8 years old, born May 22, 2017"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      List each child with their name, age, and date of birth
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Desired Custody Arrangement
                    </label>
                    <select
                      {...register('custody_preference')}
                      className="w-full border border-gray-300 rounded-lg p-3"
                    >
                      <option value="">Select preference</option>
                      <option value="joint">Joint legal and physical custody</option>
                      <option value="sole_legal">Sole legal custody to me</option>
                      <option value="sole_physical">Sole physical custody to me</option>
                      <option value="split">Split custody</option>
                      <option value="other">Other arrangement</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Property Section */}
            <div className="space-y-4 pt-6 border-t">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('property')}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <span className="text-sm font-medium">We have community property or debts</span>
              </label>

              {showPropertyFields && (
                <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200 mt-4">
                  <h3 className="font-semibold text-green-900">Property & Debts</h3>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Property and Debt Details (optional)
                    </label>
                    <textarea
                      {...register('property_details')}
                      className="w-full border border-gray-300 rounded-lg p-3 min-h-[100px]"
                      placeholder="Example:&#10;- Family home at 123 Main St&#10;- 2020 Toyota Camry&#10;- Joint bank accounts&#10;- Credit card debt&#10;- Mortgage"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      List major assets and debts (house, cars, accounts, loans)
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between pt-6">
              <Button type="button" variant="outline" onClick={prevStep}>
                Back
              </Button>
              <Button type="button" onClick={nextStep}>
                Next: Relief Requested
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Relief Requested */}
        {step === 3 && (
          <div className="space-y-6 bg-white p-8 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-6">Relief Requested</h2>

            <p className="text-sm text-gray-600 mb-6">
              Select what you're asking the court to order. You can request multiple items.
            </p>

            <div className="space-y-4">
              {formData.children && (
                <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    {...register('request_custody')}
                    className="w-5 h-5 text-blue-600 rounded mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium">Child custody and visitation orders</span>
                    <p className="text-xs text-gray-500 mt-1">
                      Request the court to determine custody arrangement and visitation schedule
                    </p>
                  </div>
                </label>
              )}

              {formData.children && (
                <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    {...register('request_support')}
                    className="w-5 h-5 text-blue-600 rounded mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium">Child support</span>
                    <p className="text-xs text-gray-500 mt-1">
                      Request child support payments based on California guidelines
                    </p>
                  </div>
                </label>
              )}

              <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  {...register('request_spousal_support')}
                  className="w-5 h-5 text-blue-600 rounded mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium">Spousal support (alimony)</span>
                  <p className="text-xs text-gray-500 mt-1">
                    Request financial support from your spouse
                  </p>
                </div>
              </label>

              {formData.property && (
                <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    {...register('request_property')}
                    className="w-5 h-5 text-blue-600 rounded mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium">Division of property and debts</span>
                    <p className="text-xs text-gray-500 mt-1">
                      Request the court to divide community property and debts equally
                    </p>
                  </div>
                </label>
              )}

              <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  {...register('request_name_change')}
                  className="w-5 h-5 text-blue-600 rounded mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium">Restore former name</span>
                  <p className="text-xs text-gray-500 mt-1">
                    Request to have your name changed back to your former name
                  </p>
                </div>
              </label>

              {formData.request_name_change && (
                <div className="ml-8 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <label className="block text-sm font-medium mb-2">
                    Former Name
                  </label>
                  <Input
                    {...register('former_name')}
                    placeholder="Jane Doe"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the name you want to use after the divorce
                  </p>
                </div>
              )}
            </div>

            {/* Attorney Information (Optional) */}
            <div className="space-y-4 pt-6 border-t">
              <h3 className="font-medium text-gray-900">Attorney Information (Optional)</h3>
              <p className="text-sm text-gray-600">
                If you're represented by an attorney, provide their information
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Attorney Name
                  </label>
                  <Input
                    {...register('attorney_name')}
                    placeholder="John Attorney, Esq."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    State Bar Number
                  </label>
                  <Input
                    {...register('attorney_bar_number')}
                    placeholder="123456"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-6">
              <Button type="button" variant="outline" onClick={prevStep}>
                Back
              </Button>
              <Button type="button" onClick={nextStep}>
                Review & Generate
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Review & Generate */}
        {step === 4 && (
          <div className="space-y-6 bg-white p-8 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-6">Review Your Information</h2>

            <div className="space-y-6">
              {/* Party Information */}
              <div className="border-b pb-6">
                <h3 className="font-semibold text-gray-900 mb-4">Party Information</h3>
                <dl className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="font-medium text-gray-500">Petitioner (You):</dt>
                    <dd className="mt-1">{formData.petitioner_name}</dd>
                    <dd className="text-gray-600">{formData.petitioner_address}</dd>
                    <dd className="text-gray-600">{formData.petitioner_city}, CA {formData.petitioner_zip}</dd>
                    {formData.petitioner_phone && (
                      <dd className="text-gray-600">{formData.petitioner_phone}</dd>
                    )}
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500">Respondent (Spouse):</dt>
                    <dd className="mt-1">{formData.respondent_name}</dd>
                    {formData.respondent_address && (
                      <dd className="text-gray-600">{formData.respondent_address}</dd>
                    )}
                  </div>
                </dl>
              </div>

              {/* Marriage Details */}
              <div className="border-b pb-6">
                <h3 className="font-semibold text-gray-900 mb-4">Marriage Details</h3>
                <dl className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="font-medium text-gray-500">Marriage Date:</dt>
                    <dd className="mt-1">{new Date(formData.marriage_date).toLocaleDateString()}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500">Separation Date:</dt>
                    <dd className="mt-1">{new Date(formData.separation_date).toLocaleDateString()}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500">County:</dt>
                    <dd className="mt-1">{formData.county}</dd>
                  </div>
                  {formData.marriage_location && (
                    <div>
                      <dt className="font-medium text-gray-500">Marriage Location:</dt>
                      <dd className="mt-1">{formData.marriage_location}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Children */}
              {formData.children && (
                <div className="border-b pb-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Children</h3>
                  <dl className="space-y-2 text-sm">
                    {formData.children_count && (
                      <div>
                        <dt className="font-medium text-gray-500 inline">Number: </dt>
                        <dd className="inline">{formData.children_count}</dd>
                      </div>
                    )}
                    {formData.children_details && (
                      <div>
                        <dt className="font-medium text-gray-500">Details:</dt>
                        <dd className="mt-1 whitespace-pre-line text-gray-600">{formData.children_details}</dd>
                      </div>
                    )}
                    {formData.custody_preference && (
                      <div>
                        <dt className="font-medium text-gray-500 inline">Custody Preference: </dt>
                        <dd className="inline capitalize">{formData.custody_preference.replace('_', ' ')}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}

              {/* Property */}
              {formData.property && (
                <div className="border-b pb-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Property & Debts</h3>
                  {formData.property_details ? (
                    <p className="text-sm whitespace-pre-line text-gray-600">{formData.property_details}</p>
                  ) : (
                    <p className="text-sm text-gray-600">Community property and debts exist</p>
                  )}
                </div>
              )}

              {/* Relief Requested */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Relief Requested</h3>
                <ul className="space-y-2 text-sm">
                  {formData.request_custody && (
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Child custody and visitation orders
                    </li>
                  )}
                  {formData.request_support && (
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Child support
                    </li>
                  )}
                  {formData.request_spousal_support && (
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Spousal support
                    </li>
                  )}
                  {formData.request_property && (
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Division of property and debts
                    </li>
                  )}
                  {formData.request_name_change && (
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Restore former name to: {formData.former_name}
                    </li>
                  )}
                  {!formData.request_custody && !formData.request_support && !formData.request_spousal_support && !formData.request_property && !formData.request_name_change && (
                    <li className="text-gray-500 italic">No specific relief requested</li>
                  )}
                </ul>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This will generate a draft divorce petition. Please review
                the generated document carefully and consult with an attorney before filing with the court.
              </p>
            </div>

            <div className="flex justify-between pt-6">
              <Button type="button" variant="outline" onClick={prevStep} disabled={isGenerating}>
                Back
              </Button>
              <Button type="submit" disabled={isGenerating} size="lg">
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

      {/* Loading Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Generating Your Document</h3>
              <p className="text-gray-600 text-sm mb-4">
                This usually takes 10-30 seconds...
              </p>
              <div className="text-xs text-gray-500 space-y-2">
                <p className={generationProgress === 'Preparing your document...' ? 'text-blue-600 font-medium' : ''}>
                  {generationProgress.includes('Preparing') ? '→ ' : '✓ '}
                  Preparing your document
                </p>
                <p className={generationProgress === 'Analyzing information...' ? 'text-blue-600 font-medium' : ''}>
                  {generationProgress.includes('Analyzing') ? '→ ' : generationProgress.includes('Generating') || generationProgress.includes('Creating') || generationProgress.includes('Upload') ? '✓ ' : ''}
                  Analyzing information
                </p>
                <p className={generationProgress === 'Generating legal text with AI...' ? 'text-blue-600 font-medium' : ''}>
                  {generationProgress.includes('Generating') ? '→ ' : generationProgress.includes('Creating') || generationProgress.includes('Upload') ? '✓ ' : ''}
                  Generating legal text with AI
                </p>
                <p className={generationProgress === 'Creating DOCX file...' ? 'text-blue-600 font-medium' : ''}>
                  {generationProgress.includes('Creating') ? '→ ' : generationProgress.includes('Upload') ? '✓ ' : ''}
                  Creating DOCX file
                </p>
                <p className={generationProgress.includes('Upload') ? 'text-blue-600 font-medium' : 'text-gray-400'}>
                  {generationProgress.includes('Upload') ? '→ ' : ''}
                  Uploading to secure storage
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
