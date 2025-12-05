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

const childSupportSchema = z.object({
  paying_parent: z.string().min(2, 'Please enter the paying parent\'s full legal name (Obligor)'),
  receiving_parent: z.string().min(2, 'Please enter the receiving parent\'s full legal name (Obligee)'),
  county: z.string().min(1, 'Please select the California county where the order will be filed'),
  number_of_children: z.string().min(1, 'Please enter the number of minor children (1 or more)'),
  children_info: z.string().min(10, 'Please list all children with full names, birthdates, and ages'),
  paying_parent_income: z.string().min(1, 'Please enter the paying parent\'s gross monthly income (before taxes)'),
  paying_parent_deductions: z.string().optional().or(z.literal('')),
  receiving_parent_income: z.string().min(1, 'Please enter the receiving parent\'s gross monthly income (enter 0 if unemployed)'),
  receiving_parent_deductions: z.string().optional().or(z.literal('')),
  timeshare: z.string().min(1, 'Please enter the timeshare percentage (e.g., 80/20, 70/30, 50/50)'),
  health_insurance: z.string().optional().or(z.literal('')),
  childcare_cost: z.string().optional().or(z.literal('')),
  payment_method: z.string().min(1, 'Please select how child support will be paid'),
  payment_day: z.string().min(1, 'Please enter the day of month when payment is due (1-31)'),
})

type FormData = z.infer<typeof childSupportSchema>

interface ChildSupportFormProps {
  template: {
    id: string
    name: string
  }
}

const PAYMENT_METHODS = [
  'Direct deposit',
  'Check',
  'State disbursement unit',
  'Other',
]

const FIELD_LABELS: Record<string, string> = {
  paying_parent: 'Paying Parent Name',
  receiving_parent: 'Receiving Parent Name',
  county: 'County',
  number_of_children: 'Number of Children',
  children_info: 'Children Details',
  paying_parent_income: 'Paying Parent Gross Monthly Income',
  paying_parent_deductions: 'Paying Parent Deductions',
  receiving_parent_income: 'Receiving Parent Gross Monthly Income',
  receiving_parent_deductions: 'Receiving Parent Deductions',
  timeshare: 'Timeshare Percentage',
  health_insurance: 'Health Insurance',
  childcare_cost: 'Childcare Cost',
  payment_method: 'Payment Method',
  payment_day: 'Payment Day',
}

const PREVIEW_SECTIONS: Record<string, string[]> = {
  'Parent Information': ['paying_parent', 'receiving_parent', 'county'],
  'Children Information': ['number_of_children', 'children_info', 'timeshare'],
  'Income Information': ['paying_parent_income', 'paying_parent_deductions', 'receiving_parent_income', 'receiving_parent_deductions'],
  'Additional Expenses': ['health_insurance', 'childcare_cost'],
  'Payment Terms': ['payment_method', 'payment_day'],
}

export default function ChildSupportForm({ template }: ChildSupportFormProps) {
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
    resolver: zodResolver(childSupportSchema),
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
        <p className="text-gray-600">Complete the form below to generate your child support order</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onPreview)} className="space-y-8">
        {/* Parent Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Parent Information</h2>
          <div className="space-y-4">
            <div>
              <FieldLabel
                label="Paying Parent Name"
                tooltip="Full legal name of the parent who will pay child support (Obligor). This is the parent with higher income or less parenting time. Use the exact name as it appears on official documents."
                required
                htmlFor="paying_parent"
              />
              <Input id="paying_parent" {...register('paying_parent')} placeholder="Example: John Michael Davis (Obligor)" />
              {errors.paying_parent && (
                <p className="text-red-600 text-sm mt-1">{errors.paying_parent.message}</p>
              )}
            </div>
            <div>
              <FieldLabel
                label="Receiving Parent Name"
                tooltip="Full legal name of the parent who will receive child support (Obligee). This is the parent with lower income or more parenting time. Use the exact name as it appears on official documents."
                required
                htmlFor="receiving_parent"
              />
              <Input id="receiving_parent" {...register('receiving_parent')} placeholder="Example: Sarah Elizabeth Davis (Obligee)" />
              {errors.receiving_parent && (
                <p className="text-red-600 text-sm mt-1">{errors.receiving_parent.message}</p>
              )}
            </div>
            <div>
              <FieldLabel
                label="County"
                tooltip="The California county where the child support order will be filed. This is typically the county where the children primarily reside or where the family law case is pending."
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

        {/* Children Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Children Information</h2>
          <div className="space-y-4">
            <div>
              <FieldLabel
                label="Number of Children"
                tooltip="Total number of minor children (under 18, or under 19 if still in high school) who are subject to this child support order. Each child increases the support amount per the guideline formula."
                required
                htmlFor="number_of_children"
              />
              <Input id="number_of_children" {...register('number_of_children')} type="number" min="1" placeholder="1, 2, 3..." />
              {errors.number_of_children && (
                <p className="text-red-600 text-sm mt-1">{errors.number_of_children.message}</p>
              )}
            </div>
            <div>
              <FieldLabel
                label="Children Details"
                tooltip="List all minor children subject to this order. Include full legal names (matching birth certificates), exact dates of birth, and current ages. This information is legally required to identify who the support is for and calculate age-specific needs."
                required
                htmlFor="children_info"
              />
              <textarea
                id="children_info"
                {...register('children_info')}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                rows={3}
                placeholder="Example:&#10;• Emma Rose Davis - DOB: 06/12/2016, Age 8&#10;• Liam James Davis - DOB: 09/03/2019, Age 5&#10;List each child's full name, date of birth, and current age"
              />
              {errors.children_info && (
                <p className="text-red-600 text-sm mt-1">{errors.children_info.message}</p>
              )}
            </div>
            <div>
              <FieldLabel
                label="Timeshare Percentage"
                tooltip="Percentage of time children spend with each parent annually. CRITICAL for guideline calculation - higher timeshare = lower support. Calculate as days/year with each parent: 73% (270 days), 50% (182 days), 20% (73 days). Even small changes (e.g., 45% vs. 50%) significantly impact support."
                required
                htmlFor="timeshare"
              />
              <Input
                id="timeshare"
                {...register('timeshare')}
                placeholder="Example: 80/20 (Receiving parent 80%, Paying parent 20%)"
              />
              {errors.timeshare && (
                <p className="text-red-600 text-sm mt-1">{errors.timeshare.message}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Percentage of time children spend with each parent (affects support calculation)
              </p>
            </div>
          </div>
        </div>

        {/* Income Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Income Information</h2>
          <div className="space-y-4">
            <div>
              <FieldLabel
                label="Paying Parent Gross Monthly Income"
                tooltip="GROSS (before taxes) monthly income from ALL sources: wages, salary, bonuses, commissions, overtime, tips, self-employment, rental income, unemployment, disability, pensions, dividends, interest. Use AVERAGE if income varies. The court may impute income if parent is voluntarily unemployed/underemployed."
                required
                htmlFor="paying_parent_income"
              />
              <Input
                id="paying_parent_income"
                {...register('paying_parent_income')}
                placeholder="Example: 6500 (wages, bonuses, commissions, rental income, etc.)"
              />
              {errors.paying_parent_income && (
                <p className="text-red-600 text-sm mt-1">{errors.paying_parent_income.message}</p>
              )}
            </div>
            <div>
              <FieldLabel
                label="Paying Parent Deductions"
                tooltip="ALLOWABLE monthly deductions from gross income: federal/state income taxes, FICA, SDI, mandatory union dues, mandatory retirement contributions, health insurance premiums. Do NOT include voluntary deductions (401k contributions, life insurance, etc.) - those don't reduce income for child support calculation."
                htmlFor="paying_parent_deductions"
              />
              <Input
                id="paying_parent_deductions"
                {...register('paying_parent_deductions')}
                placeholder="Example: 1300 (federal/state taxes, FICA, mandatory retirement, health insurance)"
              />
            </div>
            <div>
              <FieldLabel
                label="Receiving Parent Gross Monthly Income"
                tooltip="GROSS (before taxes) monthly income from ALL sources for the parent receiving child support. Include wages, self-employment, public assistance, unemployment, disability, pensions, rental income, etc. Enter 0 if unemployed. Be honest - underreporting income can result in contempt charges."
                required
                htmlFor="receiving_parent_income"
              />
              <Input
                id="receiving_parent_income"
                {...register('receiving_parent_income')}
                placeholder="Example: 4200 (all income sources before deductions)"
              />
              {errors.receiving_parent_income && (
                <p className="text-red-600 text-sm mt-1">{errors.receiving_parent_income.message}</p>
              )}
            </div>
            <div>
              <FieldLabel
                label="Receiving Parent Deductions"
                tooltip="ALLOWABLE monthly deductions from gross income: federal/state income taxes, FICA, SDI, mandatory union dues, mandatory retirement contributions, health insurance premiums. Only mandatory deductions count - voluntary savings and investments do not reduce income for support purposes."
                htmlFor="receiving_parent_deductions"
              />
              <Input
                id="receiving_parent_deductions"
                {...register('receiving_parent_deductions')}
                placeholder="Example: 900 (taxes, FICA, mandatory retirement)"
              />
            </div>
          </div>
        </div>

        {/* Additional Expenses */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Additional Expenses</h2>
          <div className="space-y-4">
            <div>
              <FieldLabel
                label="Health Insurance"
                tooltip="Cost of children's health insurance premiums paid by either parent. This is an ADD-ON to guideline support - the paying parent gets credit if they provide coverage. Include monthly premium amount, insurance provider, and which parent pays. Uninsured medical costs are typically split 50/50 or per income ratio."
                htmlFor="health_insurance"
              />
              <Input
                id="health_insurance"
                {...register('health_insurance')}
                placeholder="Example: $250/month for children's coverage through Blue Shield (paying parent provides)"
              />
            </div>
            <div>
              <FieldLabel
                label="Childcare Cost"
                tooltip="Work-related childcare expenses (daycare, after-school care, babysitter) necessary for a parent to work or get job training. This is an ADD-ON to base support - typically shared per income ratio. Must be reasonable and actually paid. Summer camps and tutoring usually don't count unless required for employment."
                htmlFor="childcare_cost"
              />
              <Input
                id="childcare_cost"
                {...register('childcare_cost')}
                placeholder="Example: $800/month for daycare/after-school care (related to employment)"
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
                tooltip="How child support will be paid. Direct deposit is fastest and creates automatic proof of payment. Wage garnishment (Income Withholding Order) is MANDATORY in California unless both parents agree otherwise and the court approves. State disbursement unit processes all payments and tracks payment history."
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
                tooltip="The date each month when child support payment is due (1-31). Typical: 1st or 15th of month. IMPORTANT: Payment is due ON this date - late payments accrue 10% annual interest. If date falls on weekend/holiday, payment is due the next business day. Some choose to align with payday."
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
            <p className="text-sm text-gray-500 mb-4">Using AI to calculate guideline child support per CA Family Code § 4055</p>
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
