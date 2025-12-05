'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FieldLabel } from '@/components/ui/tooltip'
import { DocumentPreview } from '@/components/ui/document-preview'

const spousalSupportSchema = z.object({
  paying_spouse: z.string().min(2, 'Please enter the paying spouse\'s full legal name (Payor)'),
  receiving_spouse: z.string().min(2, 'Please enter the receiving spouse\'s full legal name (Payee)'),
  county: z.string().min(1, 'Please select the California county where the order will be filed'),
  marriage_date: z.string().min(1, 'Please enter the date of marriage from your marriage certificate'),
  separation_date: z.string().min(1, 'Please enter the date when you began living separate and apart'),
  marriage_length: z.string().min(1, 'Please specify the length of marriage (e.g., "8 years, 6 months" or "12 years")'),
  paying_spouse_income: z.string().min(1, 'Please enter the paying spouse\'s gross monthly income from all sources'),
  paying_spouse_assets: z.string().optional().or(z.literal('')),
  receiving_spouse_income: z.string().min(1, 'Please enter the receiving spouse\'s gross monthly income (enter 0 if unemployed)'),
  receiving_spouse_assets: z.string().optional().or(z.literal('')),
  standard_of_living: z.string().optional().or(z.literal('')),
  support_amount: z.string().min(1, 'Please enter the monthly spousal support amount in dollars'),
  support_duration: z.string().min(1, 'Please specify how long support will be paid (e.g., "5 years" or "until remarriage")'),
  age_health: z.string().optional().or(z.literal('')),
  obligations: z.string().optional().or(z.literal('')),
  payment_method: z.string().min(1, 'Please select how spousal support will be paid'),
  payment_day: z.string().min(1, 'Please enter the day of month when payment is due (1-31)'),
  tax_treatment: z.string().optional().or(z.literal('')),
}).refine(
  (data) => {
    const marriage = new Date(data.marriage_date)
    const separation = new Date(data.separation_date)
    return separation >= marriage
  },
  {
    message: 'Separation date must be on or after the marriage date. Please check your dates.',
    path: ['separation_date'],
  }
)

type FormData = z.infer<typeof spousalSupportSchema>

interface SpousalSupportFormProps {
  template: {
    id: string
    name: string
  }
}

const PAYMENT_METHODS = [
  'Direct deposit',
  'Check',
  'Wage garnishment',
  'Other',
]

const FIELD_LABELS: Record<string, string> = {
  paying_spouse: 'Paying Spouse Name',
  receiving_spouse: 'Receiving Spouse Name',
  county: 'County',
  marriage_date: 'Date of Marriage',
  separation_date: 'Date of Separation',
  marriage_length: 'Length of Marriage',
  paying_spouse_income: 'Paying Spouse Gross Monthly Income',
  paying_spouse_assets: 'Paying Spouse Assets & Earning Capacity',
  receiving_spouse_income: 'Receiving Spouse Gross Monthly Income',
  receiving_spouse_assets: 'Receiving Spouse Assets & Earning Capacity',
  standard_of_living: 'Standard of Living During Marriage',
  support_amount: 'Monthly Support Amount',
  support_duration: 'Duration of Support',
  age_health: 'Age & Health Considerations',
  obligations: 'Other Financial Obligations',
  payment_method: 'Payment Method',
  payment_day: 'Payment Day',
  tax_treatment: 'Tax Treatment Notes',
}

const PREVIEW_SECTIONS: Record<string, string[]> = {
  'Party Information': ['paying_spouse', 'receiving_spouse', 'county'],
  'Marriage Information': ['marriage_date', 'separation_date', 'marriage_length', 'standard_of_living'],
  'Financial Information': ['paying_spouse_income', 'paying_spouse_assets', 'receiving_spouse_income', 'receiving_spouse_assets'],
  'Support Order': ['support_amount', 'support_duration', 'age_health', 'obligations'],
  'Payment Terms': ['payment_method', 'payment_day', 'tax_treatment'],
}

export default function SpousalSupportForm({ template }: SpousalSupportFormProps) {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState<FormData | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(spousalSupportSchema),
  })

  const onPreview = (data: FormData) => {
    setPreviewData(data)
    setShowPreview(true)
  }

  const onSubmit = async () => {
    if (!previewData) return

    setIsGenerating(true)
    setError(null)
    setShowPreview(false)

    try {
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
      router.push(`/documents/success?id=${result.document_id}`)
    } catch (err: any) {
      console.error('Generation error:', err)
      setError(err.message || 'Failed to generate document')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <button
          onClick={() => router.push('/documents/new')}
          className="text-blue-600 hover:text-blue-800 mb-4"
        >
          ← Back to Templates
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{template.name}</h1>
        <p className="text-gray-600">Complete the form below to generate your spousal support order</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onPreview)} className="space-y-8">
        {/* Party Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Party Information</h2>
          <div className="space-y-4">
            <div>
              <FieldLabel
                label="Paying Spouse Name"
                tooltip="Full legal name of the spouse who will pay spousal support (Payor/Obligor). This is typically the higher-earning spouse. Use the exact name as it appears on the divorce petition and official documents."
                required
                htmlFor="paying_spouse"
              />
              <Input id="paying_spouse" {...register('paying_spouse')} placeholder="Example: Robert James Martinez (Payor)" />
              {errors.paying_spouse && (
                <p className="text-red-600 text-sm mt-1">{errors.paying_spouse.message}</p>
              )}
            </div>
            <div>
              <FieldLabel
                label="Receiving Spouse Name"
                tooltip="Full legal name of the spouse who will receive spousal support (Payee/Obligee). This is typically the lower-earning or non-working spouse. Use the exact name as it appears on the divorce petition and official documents."
                required
                htmlFor="receiving_spouse"
              />
              <Input id="receiving_spouse" {...register('receiving_spouse')} placeholder="Example: Jennifer Anne Martinez (Payee)" />
              {errors.receiving_spouse && (
                <p className="text-red-600 text-sm mt-1">{errors.receiving_spouse.message}</p>
              )}
            </div>
            <div>
              <FieldLabel
                label="County"
                tooltip="The California county where the spousal support order will be filed. This is typically the county where the dissolution case is pending, which must be where at least one spouse has resided for 3+ months."
                required
                htmlFor="county"
              />
              <Input id="county" {...register('county')} placeholder="Los Angeles, Orange, San Diego, etc." />
              {errors.county && (
                <p className="text-red-600 text-sm mt-1">{errors.county.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Marriage Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Marriage Information</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel
                  label="Date of Marriage"
                  tooltip="The official date of marriage from your marriage certificate. This determines marriage length for spousal support purposes. The court counts from marriage date to separation date, NOT divorce date."
                  required
                  htmlFor="marriage_date"
                />
                <Input id="marriage_date" {...register('marriage_date')} type="date" />
                {errors.marriage_date && (
                  <p className="text-red-600 text-sm mt-1">{errors.marriage_date.message}</p>
                )}
              </div>
              <div>
                <FieldLabel
                  label="Date of Separation"
                  tooltip="Date spouses began living separately with intent to end the marriage. CRITICAL: This date determines marriage length. Under 10 years = short-term marriage (support typically half the marriage length). 10+ years = long-term (court retains indefinite jurisdiction per FC § 4336)."
                  required
                  htmlFor="separation_date"
                />
                <Input id="separation_date" {...register('separation_date')} type="date" />
                {errors.separation_date && (
                  <p className="text-red-600 text-sm mt-1">{errors.separation_date.message}</p>
                )}
              </div>
            </div>
            <div>
              <FieldLabel
                label="Length of Marriage"
                tooltip="Duration from marriage to separation (NOT divorce). CRUCIAL: Under 10 years = 'short-term' marriage (spousal support typically limited to 1/2 the marriage length). 10+ years = 'long-term' marriage (court retains jurisdiction indefinitely per FC § 4336). Example: 9 years, 11 months is short-term; 10 years, 1 day is long-term."
                required
                htmlFor="marriage_length"
              />
              <Input
                id="marriage_length"
                {...register('marriage_length')}
                placeholder="Example: 12 years, 3 months (long-term) or 7 years (short-term)"
              />
              {errors.marriage_length && (
                <p className="text-red-600 text-sm mt-1">{errors.marriage_length.message}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Important: Marriages under 10 years = short-term (support typically 1/2 length). 10+ years = long-term (court retains indefinite jurisdiction)
              </p>
            </div>
            <div>
              <FieldLabel
                label="Standard of Living During Marriage"
                tooltip="Describe the lifestyle both spouses enjoyed during the marriage. This is one of the 14 FC § 4320 factors courts MUST consider. Include: combined income, housing type/location, vacations, dining habits, children's schooling, vehicles, entertainment. The goal is to maintain a similar standard of living for the lower-earning spouse."
                htmlFor="standard_of_living"
              />
              <textarea
                id="standard_of_living"
                {...register('standard_of_living')}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                rows={3}
                placeholder="Example: Combined annual income of $180,000, owned 4-bedroom home in suburban neighborhood, vacationed twice yearly, children in private school, two newer vehicles"
              />
            </div>
          </div>
        </div>

        {/* Financial Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Financial Information</h2>
          <div className="space-y-4">
            <div>
              <FieldLabel
                label="Paying Spouse Gross Monthly Income"
                tooltip="GROSS (before taxes) monthly income from ALL sources: wages, salary, bonuses, commissions, self-employment income, rental income, investment income, pensions, unemployment, disability, etc. This is a key FC § 4320(c) factor - the ability to pay support."
                required
                htmlFor="paying_spouse_income"
              />
              <Input
                id="paying_spouse_income"
                {...register('paying_spouse_income')}
                placeholder="Example: 12500 (all sources: salary, bonuses, rental income, investments)"
              />
              {errors.paying_spouse_income && (
                <p className="text-red-600 text-sm mt-1">{errors.paying_spouse_income.message}</p>
              )}
            </div>
            <div>
              <FieldLabel
                label="Paying Spouse Assets & Earning Capacity"
                tooltip="Describe education, job skills, work history, assets, age, and health of the paying spouse. These are FC § 4320 factors. Include: degrees, certifications, years of experience, current job, assets (retirement, real estate), age, health status, earning potential. Helps court assess ability to pay and whether income could be higher."
                htmlFor="paying_spouse_assets"
              />
              <textarea
                id="paying_spouse_assets"
                {...register('paying_spouse_assets')}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                rows={2}
                placeholder="Example: MBA in Finance, 15 years as Financial Analyst, $500k in retirement accounts, owns rental property. Full earning capacity, age 45, excellent health."
              />
            </div>
            <div>
              <FieldLabel
                label="Receiving Spouse Gross Monthly Income"
                tooltip="GROSS (before taxes) monthly income from ALL sources for the spouse receiving support. Include wages, self-employment, part-time work, unemployment, disability, etc. Enter 0 if not employed. The court compares both spouses' incomes to determine need and ability to pay per FC § 4320."
                required
                htmlFor="receiving_spouse_income"
              />
              <Input
                id="receiving_spouse_income"
                {...register('receiving_spouse_income')}
                placeholder="Example: 3500 (part-time work) or 0 (not employed)"
              />
              {errors.receiving_spouse_income && (
                <p className="text-red-600 text-sm mt-1">{errors.receiving_spouse_income.message}</p>
              )}
            </div>
            <div>
              <FieldLabel
                label="Receiving Spouse Assets & Earning Capacity"
                tooltip="Describe education, work history, marketable skills, assets, age, health, and employability of the receiving spouse. KEY FC § 4320 factors include: ability to become self-supporting, time out of workforce, skills/training needed, impact of unemployment on children, age/health limitations. Be honest - court can impute income if voluntarily unemployed."
                htmlFor="receiving_spouse_assets"
              />
              <textarea
                id="receiving_spouse_assets"
                {...register('receiving_spouse_assets')}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                rows={2}
                placeholder="Example: BA in Education but hasn't worked full-time in 10 years while raising children. Would need retraining/certification to return to workforce. Age 42, some health issues (arthritis)."
              />
            </div>
          </div>
        </div>

        {/* Support Order */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Support Order</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel
                  label="Monthly Support Amount"
                  tooltip="Dollar amount of spousal support to be paid each month. There is NO FORMULA for spousal support (unlike child support). Amount is based on all 14 FC § 4320 factors: needs, ability to pay, standard of living, marriage length, age, health, earning capacity, etc. Temporary support often uses guideline calculator; permanent support is more discretion."
                  required
                  htmlFor="support_amount"
                />
                <Input
                  id="support_amount"
                  {...register('support_amount')}
                  placeholder="Example: 3500 (based on needs and ability to pay)"
                />
                {errors.support_amount && (
                  <p className="text-red-600 text-sm mt-1">{errors.support_amount.message}</p>
                )}
              </div>
              <div>
                <FieldLabel
                  label="Duration of Support"
                  tooltip="How long support will be paid. Short-term marriages (under 10 years): typically 1/2 marriage length. Long-term marriages (10+ years): court retains indefinite jurisdiction per FC § 4336. Support automatically ends upon: remarriage of recipient, death of either party, or cohabitation with new partner (rebuttable presumption of decreased need)."
                  required
                  htmlFor="support_duration"
                />
                <Input
                  id="support_duration"
                  {...register('support_duration')}
                  placeholder="Example: 6 years (until remarriage, death, or cohabitation, whichever first)"
                />
                {errors.support_duration && (
                  <p className="text-red-600 text-sm mt-1">{errors.support_duration.message}</p>
                )}
              </div>
            </div>
            <div>
              <FieldLabel
                label="Age & Health Considerations"
                tooltip="FC § 4320(h) requires court to consider age and health of both parties. Include: current ages, health conditions (chronic illness, disability), impact on earning capacity, medical expenses, life expectancy, ability to work. Age/health can shorten or lengthen support duration and affect amount."
                htmlFor="age_health"
              />
              <textarea
                id="age_health"
                {...register('age_health')}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                rows={2}
                placeholder="Example: Paying spouse is 45, good health, full earning capacity. Receiving spouse is 42 with chronic arthritis limiting ability to work full-time."
              />
            </div>
            <div>
              <FieldLabel
                label="Other Financial Obligations"
                tooltip="FC § 4320(k) considers each party's obligations and assets. Include: child support payments, debts (credit cards, loans), support for other dependents, marital assets received in property division, separate property assets. These affect ability to pay and need for support."
                htmlFor="obligations"
              />
              <textarea
                id="obligations"
                {...register('obligations')}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                rows={2}
                placeholder="Example: Paying spouse pays $1,800/month child support for 2 children. Receiving spouse has $15,000 in credit card debt from marital period."
              />
            </div>
          </div>
        </div>

        {/* Payment Terms */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Payment Terms</h2>
          <div className="space-y-4">
            <div>
              <FieldLabel
                label="Payment Method"
                tooltip="How spousal support will be paid. Direct deposit is fastest and creates automatic proof of payment. Wage garnishment (Earnings Assignment Order) is common to ensure consistent payment. Check is traditional but requires recipient to track and payor to prove timely payment. Choose method that minimizes conflict and ensures reliability."
                required
                htmlFor="payment_method"
              />
              <select
                id="payment_method"
                {...register('payment_method')}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              >
                <option value="">Select payment method</option>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
              {errors.payment_method && (
                <p className="text-red-600 text-sm mt-1">{errors.payment_method.message}</p>
              )}
            </div>
            <div>
              <FieldLabel
                label="Day of Month for Payment"
                tooltip="The date each month when spousal support payment is due (1-31). Typical: 1st or 15th of month. CRITICAL: Payment must be ON TIME - late payments can accrue 10% annual interest and lead to contempt charges. If date falls on weekend/holiday, payment is due the next business day. Many align with payday to ensure funds are available."
                required
                htmlFor="payment_day"
              />
              <Input
                id="payment_day"
                {...register('payment_day')}
                type="number"
                min="1"
                max="31"
                placeholder="1-31"
              />
              {errors.payment_day && (
                <p className="text-red-600 text-sm mt-1">{errors.payment_day.message}</p>
              )}
            </div>
            <div>
              <FieldLabel
                label="Tax Treatment Notes"
                tooltip="MAJOR TAX CHANGE (2019): For divorces/separations after Dec 31, 2018, spousal support is NOT tax-deductible for payor and NOT taxable income for payee (Tax Cuts and Jobs Act). For pre-2019 divorces, old rules apply: payor deducts, payee reports as income. This significantly affects after-tax cost/benefit of spousal support."
                htmlFor="tax_treatment"
              />
              <Input
                id="tax_treatment"
                {...register('tax_treatment')}
                placeholder="For post-2018 divorces: NOT deductible/taxable per Tax Cuts and Jobs Act"
              />
              <p className="text-sm text-gray-500 mt-1">
                Note: Spousal support is NOT tax-deductible for payor and NOT taxable income for payee (divorces after 12/31/2018)
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/documents/new')}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isGenerating} className="flex-1">
            Preview & Generate Document
          </Button>
        </div>
      </form>

      <DocumentPreview
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onConfirm={onSubmit}
        templateName={template.name}
        formData={previewData || {}}
        fieldLabels={FIELD_LABELS}
        sections={PREVIEW_SECTIONS}
      />

      {isGenerating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Generating Your Document...</h3>
            <p className="text-gray-700 mb-1">Creating your {template.name}</p>
            <p className="text-sm text-gray-500 mb-4">Using AI to analyze all 14 Family Code § 4320 factors for spousal support</p>
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
