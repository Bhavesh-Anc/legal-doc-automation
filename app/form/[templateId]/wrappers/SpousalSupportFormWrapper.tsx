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
  optionalCurrencySchema,
  CALIFORNIA_COUNTIES,
  pastDateSchema,
  validationHelpers,
} from '@/lib/form-validations'

const spousalSupportSchema = z.object({
  paying_spouse: z.string().min(2, 'Please enter paying spouse\'s full name'),
  paying_spouse_address: z.string().optional().or(z.literal('')),
  receiving_spouse: z.string().min(2, 'Please enter receiving spouse\'s full name'),
  receiving_spouse_address: z.string().optional().or(z.literal('')),
  county: z.enum(CALIFORNIA_COUNTIES as unknown as [string, ...string[]], {
    errorMap: () => ({ message: 'Please select a valid California county' })
  }),
  marriage_date: pastDateSchema('Marriage date').optional().or(z.literal('')),
  separation_date: pastDateSchema('Separation date').optional().or(z.literal('')),
  marriage_length: z.string().optional().or(z.literal('')),
  long_term_marriage: z.boolean().optional(),
  paying_spouse_income: optionalCurrencySchema,
  paying_spouse_income_source: z.string().optional().or(z.literal('')),
  paying_spouse_age: z.string().optional().or(z.literal('')),
  paying_spouse_health: z.string().optional().or(z.literal('')),
  paying_spouse_education: z.string().optional().or(z.literal('')),
  paying_spouse_assets: z.string().optional().or(z.literal('')),
  receiving_spouse_income: optionalCurrencySchema,
  receiving_spouse_income_source: z.string().optional().or(z.literal('')),
  receiving_spouse_needs: optionalCurrencySchema,
  receiving_spouse_age: z.string().optional().or(z.literal('')),
  receiving_spouse_health: z.string().optional().or(z.literal('')),
  receiving_spouse_education: z.string().optional().or(z.literal('')),
  receiving_spouse_assets: z.string().optional().or(z.literal('')),
  time_needed_for_training: z.string().optional().or(z.literal('')),
  marital_standard_of_living: z.string().optional().or(z.literal('')),
  support_amount: optionalCurrencySchema,
  support_duration: z.string().optional().or(z.literal('')),
  payment_method: z.string().optional().or(z.literal('')),
  payment_date: z.string().optional().or(z.literal('')),
  termination_events: z.string().optional().or(z.literal('')),
}).refine(
  (data) => {
    // If both dates are provided, marriage must be before separation
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

type FormData = z.infer<typeof spousalSupportSchema>

interface SpousalSupportFormWrapperProps {
  template: {
    id: string
    name: string
  }
}

const FIELD_LABELS: Record<string, string> = {
  paying_spouse: 'Paying Spouse Name',
  receiving_spouse: 'Receiving Spouse Name',
  county: 'County',
  marriage_date: 'Marriage Date',
  separation_date: 'Separation Date',
  marriage_length: 'Marriage Length',
  paying_spouse_income: 'Paying Spouse Income',
  receiving_spouse_income: 'Receiving Spouse Income',
  receiving_spouse_needs: 'Receiving Spouse Needs',
  marital_standard_of_living: 'Marital Standard of Living',
  support_amount: 'Support Amount',
  support_duration: 'Support Duration',
  payment_method: 'Payment Method',
}

const PREVIEW_SECTIONS: Record<string, string[]> = {
  'Spouses': ['paying_spouse', 'receiving_spouse', 'county'],
  'Marriage': ['marriage_date', 'separation_date', 'marriage_length'],
  'Income & Needs': ['paying_spouse_income', 'receiving_spouse_income', 'receiving_spouse_needs', 'marital_standard_of_living'],
  'Support Order': ['support_amount', 'support_duration', 'payment_method'],
}

const STORAGE_KEY = 'spousal_support_draft'

export default function SpousalSupportFormWrapper({ template }: SpousalSupportFormWrapperProps) {
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
    resolver: zodResolver(spousalSupportSchema),
    defaultValues: {
      long_term_marriage: false,
      payment_method: 'Direct payment',
      payment_date: '1st day of each month',
      termination_events: 'Death of either party, remarriage of receiving spouse, or cohabitation',
    }
  })

  const formData = watch()
  useEffect(() => {
    const handler = setTimeout(() => {
      if (formData && Object.keys(formData).length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formData))
      }
    }, 1000)
    return () => clearTimeout(handler)
  }, [formData])

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

  const isLongTermMarriage = watch('long_term_marriage')

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <button onClick={() => router.push('/start')} className="text-blue-600 hover:text-blue-800 mb-4">
          ← Back to Templates
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{template.name}</h1>
        <p className="text-gray-600">Complete the form below to generate your spousal support order</p>
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
        {/* Spouse Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Spouse Information</h2>
          <div className="space-y-4">
            <div>
              <FieldLabel
                label="Paying Spouse (Payor) Name"
                tooltip="The spouse who will be paying spousal support. Usually the higher-earning spouse."
                required
                htmlFor="paying_spouse"
              />
              <Input id="paying_spouse" {...register('paying_spouse')} placeholder="John David Smith" />
              {errors.paying_spouse && <p className="text-red-600 text-sm mt-1">{errors.paying_spouse.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Paying Spouse Address</label>
              <Input {...register('paying_spouse_address')} placeholder="456 Oak Avenue, Los Angeles, CA 90001" />
            </div>
            <div>
              <FieldLabel
                label="Receiving Spouse (Payee) Name"
                tooltip="The spouse who will receive the spousal support payments. Usually the lower-earning or dependent spouse."
                required
                htmlFor="receiving_spouse"
              />
              <Input id="receiving_spouse" {...register('receiving_spouse')} placeholder="Jane Marie Smith" />
              {errors.receiving_spouse && <p className="text-red-600 text-sm mt-1">{errors.receiving_spouse.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Receiving Spouse Address</label>
              <Input {...register('receiving_spouse_address')} placeholder="123 Main Street, Los Angeles, CA 90001" />
            </div>
            <div>
              <FieldLabel
                label="County"
                tooltip="California county where this spousal support order will be filed"
                required
                htmlFor="county"
              />
              <Input id="county" {...register('county')} placeholder="Los Angeles, Orange, San Diego, etc." />
              {errors.county && <p className="text-red-600 text-sm mt-1">{errors.county.message}</p>}
            </div>
          </div>
        </div>

        {/* Marriage Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Marriage Duration</h2>
          <p className="text-sm text-gray-600 mb-4">Marriage length is critical for spousal support. Marriages of 10+ years are "long-term" and court retains jurisdiction indefinitely.</p>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date of Marriage</label>
                <Input {...register('marriage_date')} type="date" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date of Separation</label>
                <Input {...register('separation_date')} type="date" />
              </div>
            </div>
            <div>
              <FieldLabel
                label="Length of Marriage"
                tooltip="Calculate the years and months from marriage date to separation date. This determines whether it's a long-term (10+ years) or short-term marriage."
                htmlFor="marriage_length"
              />
              <Input id="marriage_length" {...register('marriage_length')} placeholder="7 years, 3 months" />
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input type="checkbox" {...register('long_term_marriage')} className="rounded" />
                <span className="text-sm font-medium">This is a long-term marriage (10+ years)</span>
              </label>
              {isLongTermMarriage && (
                <p className="text-sm text-blue-700 mt-2 ml-6">
                  ✓ Court retains jurisdiction indefinitely. Support may be for extended or indefinite period.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Paying Spouse Financial Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Paying Spouse - Ability to Pay (FC § 4320(c))</h2>
          <div className="space-y-4">
            <div>
              <FieldLabel
                label="Gross Monthly Income"
                tooltip="Total monthly income before taxes. Include all sources: wages, salary, bonuses, self-employment, rental income, investments."
                htmlFor="paying_spouse_income"
              />
              <Input id="paying_spouse_income" {...register('paying_spouse_income')} placeholder="$8,500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Income Source</label>
              <Input {...register('paying_spouse_income_source')} placeholder="Software Engineer at Tech Corp + rental income" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Age</label>
                <Input {...register('paying_spouse_age')} type="number" placeholder="45" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Health Status</label>
                <Input {...register('paying_spouse_health')} placeholder="Good health, no limitations" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Education & Skills</label>
              <Input {...register('paying_spouse_education')} placeholder="Bachelor's degree in Computer Science, 20 years experience" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Assets</label>
              <textarea
                {...register('paying_spouse_assets')}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                rows={2}
                placeholder="401k $200,000, savings $50,000, home equity $150,000"
              />
            </div>
          </div>
        </div>

        {/* Receiving Spouse Financial Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Receiving Spouse - Needs & Earning Capacity (FC § 4320(a))</h2>
          <div className="space-y-4">
            <div>
              <FieldLabel
                label="Current Gross Monthly Income"
                tooltip="Current income from all sources. If unemployed or underemployed, explain earning capacity."
                htmlFor="receiving_spouse_income"
              />
              <Input id="receiving_spouse_income" {...register('receiving_spouse_income')} placeholder="$3,200" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Income Source / Employment Status</label>
              <Input {...register('receiving_spouse_income_source')} placeholder="Part-time receptionist, seeking full-time employment" />
            </div>
            <div>
              <FieldLabel
                label="Monthly Needs & Expenses"
                tooltip="Reasonable monthly expenses based on marital standard of living: housing, food, utilities, transportation, healthcare, etc."
                htmlFor="receiving_spouse_needs"
              />
              <Input id="receiving_spouse_needs" {...register('receiving_spouse_needs')} placeholder="$5,800/month" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Age</label>
                <Input {...register('receiving_spouse_age')} type="number" placeholder="42" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Health Status</label>
                <Input {...register('receiving_spouse_health')} placeholder="Chronic condition limiting work capacity" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Education & Skills</label>
              <Input {...register('receiving_spouse_education')} placeholder="High school diploma, administrative skills" />
            </div>
            <div>
              <FieldLabel
                label="Time Needed for Job Training/Education"
                tooltip="Under FC § 4320(a), estimate how long it would take to acquire marketable skills or education to become self-supporting."
                htmlFor="time_needed_for_training"
              />
              <Input id="time_needed_for_training" {...register('time_needed_for_training')} placeholder="2 years for Associate's degree in Nursing" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Assets</label>
              <textarea
                {...register('receiving_spouse_assets')}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                rows={2}
                placeholder="Awarded share of community property: $75,000 home equity, $40,000 retirement"
              />
            </div>
          </div>
        </div>

        {/* Marital Standard of Living */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Marital Standard of Living (FC § 4320(d))</h2>
          <p className="text-sm text-gray-600 mb-4">The lifestyle established during the marriage - housing, travel, dining, entertainment, etc.</p>
          <div>
            <FieldLabel
              label="Standard of Living During Marriage"
              tooltip="Describe the standard of living enjoyed during the marriage. This is a key factor in determining support amount."
              htmlFor="marital_standard_of_living"
            />
            <textarea
              id="marital_standard_of_living"
              {...register('marital_standard_of_living')}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              rows={3}
              placeholder="Upper-middle class: 4-bedroom home, 2 new cars, annual vacations, frequent dining out, private school for children, combined income approximately $120,000/year"
            />
          </div>
        </div>

        {/* Support Terms */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Spousal Support Order</h2>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <p className="text-sm text-blue-900">
                <strong>Family Code § 4320 Factors:</strong> The court considers all 14 factors including income, needs, duration of marriage, age, health, assets, and contributions to education/career. For short-term marriages, support typically lasts about half the marriage length with goal of self-sufficiency.
              </p>
            </div>
            <div>
              <FieldLabel
                label="Proposed Support Amount (Monthly)"
                tooltip="Reasonable support amount considering paying spouse's ability to pay and receiving spouse's needs based on marital standard of living."
                htmlFor="support_amount"
              />
              <Input id="support_amount" {...register('support_amount')} placeholder="$2,500/month" />
            </div>
            <div>
              <FieldLabel
                label="Duration of Support"
                tooltip="For short-term marriages: typically 1/2 marriage length. For long-term (10+ years): may be indefinite with court retaining jurisdiction. Or specify step-down: $3,000 for 2 years, then $2,000 for 2 years, etc."
                htmlFor="support_duration"
              />
              <textarea
                id="support_duration"
                {...register('support_duration')}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                rows={2}
                placeholder="3.5 years (half the 7-year marriage) with goal of self-sufficiency"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Payment Method</label>
              <select {...register('payment_method')} className="w-full px-3 py-2 border border-gray-300 rounded">
                <option value="Direct payment">Direct payment between spouses</option>
                <option value="Wage assignment">Income Withholding Order (wage assignment)</option>
                <option value="Through attorney trust account">Through attorney trust account</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Payment Due Date</label>
              <select {...register('payment_date')} className="w-full px-3 py-2 border border-gray-300 rounded">
                <option value="1st day of each month">1st day of each month</option>
                <option value="15th day of each month">15th day of each month</option>
                <option value="First and fifteenth of each month">First and fifteenth (split payment)</option>
              </select>
            </div>
            <div>
              <FieldLabel
                label="Termination Events"
                tooltip="Support automatically terminates upon death of either party, remarriage of receiving spouse, or (rebuttable) cohabitation with non-marital partner (FC § 4337)."
                htmlFor="termination_events"
              />
              <Input
                id="termination_events"
                {...register('termination_events')}
                placeholder="Death of either party, remarriage, or cohabitation"
              />
            </div>
          </div>
        </div>

        {/* Tax Information */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-2">Tax Treatment (Post-2018 Divorces)</h3>
          <p className="text-sm text-yellow-900">
            <strong>Important:</strong> For divorces finalized after December 31, 2018, spousal support is NOT tax-deductible for the payor and NOT taxable income for the payee. This is a significant change from pre-2019 law.
          </p>
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
            <p className="text-sm text-gray-500 mb-4">Using AI to draft a court-ready support order</p>
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
