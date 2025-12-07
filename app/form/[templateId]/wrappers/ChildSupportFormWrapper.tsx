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

const childSupportSchema = z.object({
  paying_parent: z.string().min(2, 'Please enter paying parent\'s full name'),
  paying_parent_address: z.string().optional().or(z.literal('')),
  receiving_parent: z.string().min(2, 'Please enter receiving parent\'s full name'),
  receiving_parent_address: z.string().optional().or(z.literal('')),
  county: z.string().min(1, 'Please select the California county'),
  children_info: z.string().min(10, 'Please list all children with names, dates of birth, and ages'),
  number_of_children: z.string().min(1, 'Please enter the number of minor children'),
  paying_parent_income: z.string().optional().or(z.literal('')),
  paying_parent_income_source: z.string().optional().or(z.literal('')),
  paying_parent_deductions: z.string().optional().or(z.literal('')),
  receiving_parent_income: z.string().optional().or(z.literal('')),
  receiving_parent_income_source: z.string().optional().or(z.literal('')),
  receiving_parent_deductions: z.string().optional().or(z.literal('')),
  paying_parent_timeshare: z.string().optional().or(z.literal('')),
  receiving_parent_timeshare: z.string().optional().or(z.literal('')),
  timeshare: z.string().optional().or(z.literal('')),
  childcare_costs: z.string().optional().or(z.literal('')),
  health_insurance_premium: z.string().optional().or(z.literal('')),
  uninsured_medical: z.string().optional().or(z.literal('')),
  guideline_support_amount: z.string().optional().or(z.literal('')),
  payment_method: z.string().optional().or(z.literal('')),
  payment_date: z.string().optional().or(z.literal('')),
})

type FormData = z.infer<typeof childSupportSchema>

interface ChildSupportFormWrapperProps {
  template: {
    id: string
    name: string
  }
}

const FIELD_LABELS: Record<string, string> = {
  paying_parent: 'Paying Parent Name',
  receiving_parent: 'Receiving Parent Name',
  county: 'County',
  children_info: 'Children Information',
  number_of_children: 'Number of Children',
  paying_parent_income: 'Paying Parent Income',
  receiving_parent_income: 'Receiving Parent Income',
  paying_parent_timeshare: 'Paying Parent Time %',
  receiving_parent_timeshare: 'Receiving Parent Time %',
  childcare_costs: 'Childcare Costs',
  health_insurance_premium: 'Health Insurance Premium',
  guideline_support_amount: 'Support Amount',
  payment_method: 'Payment Method',
}

const PREVIEW_SECTIONS: Record<string, string[]> = {
  'Parents': ['paying_parent', 'receiving_parent', 'county'],
  'Children': ['children_info', 'number_of_children'],
  'Income': ['paying_parent_income', 'receiving_parent_income'],
  'Timeshare': ['paying_parent_timeshare', 'receiving_parent_timeshare'],
  'Add-Ons': ['childcare_costs', 'health_insurance_premium'],
  'Support Order': ['guideline_support_amount', 'payment_method'],
}

const STORAGE_KEY = 'child_support_draft'

export default function ChildSupportFormWrapper({ template }: ChildSupportFormWrapperProps) {
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
    resolver: zodResolver(childSupportSchema),
    defaultValues: {
      payment_method: 'Income Withholding Order (wage assignment)',
      payment_date: '1st day of each month',
      uninsured_medical: 'Split 50/50',
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

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <button onClick={() => router.push('/start')} className="text-blue-600 hover:text-blue-800 mb-4">
          ← Back to Templates
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{template.name}</h1>
        <p className="text-gray-600">Complete the form below to generate your child support order</p>
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
        {/* Parent Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Parent Information</h2>
          <div className="space-y-4">
            <div>
              <FieldLabel
                label="Paying Parent (Obligor) Name"
                tooltip="The parent who will be paying child support. Usually the parent with lower timeshare or higher income."
                required
                htmlFor="paying_parent"
              />
              <Input id="paying_parent" {...register('paying_parent')} placeholder="John David Smith" />
              {errors.paying_parent && <p className="text-red-600 text-sm mt-1">{errors.paying_parent.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Paying Parent Address</label>
              <Input {...register('paying_parent_address')} placeholder="456 Oak Avenue, Los Angeles, CA 90001" />
            </div>
            <div>
              <FieldLabel
                label="Receiving Parent (Obligee) Name"
                tooltip="The parent who will receive the child support payments. Usually the custodial parent."
                required
                htmlFor="receiving_parent"
              />
              <Input id="receiving_parent" {...register('receiving_parent')} placeholder="Jane Marie Smith" />
              {errors.receiving_parent && <p className="text-red-600 text-sm mt-1">{errors.receiving_parent.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Receiving Parent Address</label>
              <Input {...register('receiving_parent_address')} placeholder="123 Main Street, Los Angeles, CA 90001" />
            </div>
            <div>
              <FieldLabel
                label="County"
                tooltip="California county where this child support order will be filed"
                required
                htmlFor="county"
              />
              <Input id="county" {...register('county')} placeholder="Los Angeles, Orange, San Diego, etc." />
              {errors.county && <p className="text-red-600 text-sm mt-1">{errors.county.message}</p>}
            </div>
          </div>
        </div>

        {/* Children Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Children Subject to Support</h2>
          <div className="space-y-4">
            <div>
              <FieldLabel
                label="Number of Minor Children"
                tooltip="The number of children under 18 for whom support is being ordered"
                required
                htmlFor="number_of_children"
              />
              <Input id="number_of_children" {...register('number_of_children')} type="number" placeholder="2" />
              {errors.number_of_children && <p className="text-red-600 text-sm mt-1">{errors.number_of_children.message}</p>}
            </div>
            <div>
              <FieldLabel
                label="Children Information"
                tooltip="List each child's full name, date of birth, and age. This is necessary for the court order."
                required
                htmlFor="children_info"
              />
              <textarea
                id="children_info"
                {...register('children_info')}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                rows={3}
                placeholder="Example:&#10;• Emma Jane Smith - DOB: 05/15/2015, Age 8&#10;• Noah Michael Smith - DOB: 03/20/2018, Age 5"
              />
              {errors.children_info && <p className="text-red-600 text-sm mt-1">{errors.children_info.message}</p>}
            </div>
          </div>
        </div>

        {/* Income Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Income Information</h2>
          <p className="text-sm text-gray-600 mb-4">California uses a mandatory guideline formula (Family Code § 4055) based on both parents' income and timeshare.</p>

          <div className="space-y-6">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-lg mb-3">Paying Parent Income</h3>
              <div className="space-y-4">
                <div>
                  <FieldLabel
                    label="Gross Monthly Income"
                    tooltip="Total monthly income before taxes and deductions. Include wages, salary, commissions, bonuses, self-employment income, rental income, unemployment, disability, etc."
                    htmlFor="paying_parent_income"
                  />
                  <Input id="paying_parent_income" {...register('paying_parent_income')} placeholder="$6,500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Income Source</label>
                  <Input {...register('paying_parent_income_source')} placeholder="Wages from ABC Company + rental income" />
                </div>
                <div>
                  <FieldLabel
                    label="Allowable Deductions"
                    tooltip="Deductions allowed under Family Code § 4059: mandatory retirement contributions, health insurance premiums, union dues, etc."
                    htmlFor="paying_parent_deductions"
                  />
                  <Input id="paying_parent_deductions" {...register('paying_parent_deductions')} placeholder="$1,300 (taxes, FICA, 401k)" />
                </div>
              </div>
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-semibold text-lg mb-3">Receiving Parent Income</h3>
              <div className="space-y-4">
                <div>
                  <FieldLabel
                    label="Gross Monthly Income"
                    tooltip="Total monthly income before taxes and deductions. If unemployed or underemployed, court may impute income based on earning capacity."
                    htmlFor="receiving_parent_income"
                  />
                  <Input id="receiving_parent_income" {...register('receiving_parent_income')} placeholder="$4,500" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Income Source</label>
                  <Input {...register('receiving_parent_income_source')} placeholder="Part-time employment at XYZ Store" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Allowable Deductions</label>
                  <Input {...register('receiving_parent_deductions')} placeholder="$950 (taxes, FICA)" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeshare */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Timeshare (Custody Percentage)</h2>
          <p className="text-sm text-gray-600 mb-4">Timeshare is the percentage of time children spend with each parent. This significantly affects the support calculation. Include overnight visits.</p>
          <div className="space-y-4">
            <div>
              <FieldLabel
                label="Paying Parent's Timeshare"
                tooltip="Percentage of time children spend with paying parent (example: 20% = every other weekend, 35% = alternating weeks, 50% = equal time)"
                htmlFor="paying_parent_timeshare"
              />
              <Input id="paying_parent_timeshare" {...register('paying_parent_timeshare')} placeholder="20% (every other weekend)" />
            </div>
            <div>
              <FieldLabel
                label="Receiving Parent's Timeshare"
                tooltip="Percentage of time children spend with receiving parent (must add up to 100% with paying parent)"
                htmlFor="receiving_parent_timeshare"
              />
              <Input id="receiving_parent_timeshare" {...register('receiving_parent_timeshare')} placeholder="80% (primary custodian)" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Overall Custody Arrangement</label>
              <Input {...register('timeshare')} placeholder="Receiving parent has primary physical custody, paying parent has visitation" />
            </div>
          </div>
        </div>

        {/* Add-On Expenses */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Mandatory Add-On Expenses</h2>
          <p className="text-sm text-gray-600 mb-4">These expenses are added to base guideline support per Family Code § 4062.</p>
          <div className="space-y-4">
            <div>
              <FieldLabel
                label="Childcare Costs (Monthly)"
                tooltip="Work-related or education-related childcare expenses. Typically split proportional to each parent's income percentage."
                htmlFor="childcare_costs"
              />
              <Input id="childcare_costs" {...register('childcare_costs')} placeholder="$800/month (daycare for both children)" />
            </div>
            <div>
              <FieldLabel
                label="Health Insurance Premium (Children Only)"
                tooltip="Monthly cost of health insurance covering the children. Do not include adult coverage."
                htmlFor="health_insurance_premium"
              />
              <Input id="health_insurance_premium" {...register('health_insurance_premium')} placeholder="$350/month" />
            </div>
            <div>
              <FieldLabel
                label="Uninsured Medical Expenses"
                tooltip="How uninsured medical, dental, and orthodontic expenses will be divided. Common: 50/50 or proportional to income."
                htmlFor="uninsured_medical"
              />
              <select
                id="uninsured_medical"
                {...register('uninsured_medical')}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              >
                <option value="Split 50/50">Split 50/50</option>
                <option value="Proportional to income">Proportional to income percentage</option>
                <option value="Paying parent pays 100%">Paying parent pays 100%</option>
              </select>
            </div>
          </div>
        </div>

        {/* Support Calculation */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Child Support Order</h2>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <p className="text-sm text-blue-900">
                <strong>California Guideline Formula (FC § 4055):</strong> The court will calculate support using a complex formula that considers both parents' net disposable income, timeshare percentages, and add-on expenses. You can use the DissoMaster calculator or California child support calculator online for an estimate.
              </p>
            </div>
            <div>
              <FieldLabel
                label="Guideline Support Amount (if calculated)"
                tooltip="If you've calculated the guideline amount using DissoMaster or online calculator, enter it here. Otherwise, the court will calculate it."
                htmlFor="guideline_support_amount"
              />
              <Input id="guideline_support_amount" {...register('guideline_support_amount')} placeholder="$1,285/month" />
            </div>
            <div>
              <FieldLabel
                label="Payment Method"
                tooltip="How child support will be paid. Income Withholding Order (wage garnishment) is standard and ensures consistent payments."
                htmlFor="payment_method"
              />
              <select
                id="payment_method"
                {...register('payment_method')}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              >
                <option value="Income Withholding Order (wage assignment)">Income Withholding Order (wage assignment)</option>
                <option value="Direct payment">Direct payment between parents</option>
                <option value="Through California DCSS">Through California Department of Child Support Services</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Payment Due Date</label>
              <select {...register('payment_date')} className="w-full px-3 py-2 border border-gray-300 rounded">
                <option value="1st day of each month">1st day of each month</option>
                <option value="15th day of each month">15th day of each month</option>
                <option value="First and fifteenth of each month (split)">First and fifteenth (split payment)</option>
              </select>
            </div>
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
