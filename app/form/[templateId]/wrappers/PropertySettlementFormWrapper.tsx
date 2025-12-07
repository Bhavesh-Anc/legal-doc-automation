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

const propertySchema = z.object({
  party1_name: z.string().min(2, 'Please enter Party 1\'s full legal name'),
  party1_address: z.string().optional().or(z.literal('')),
  party2_name: z.string().min(2, 'Please enter Party 2\'s full legal name'),
  party2_address: z.string().optional().or(z.literal('')),
  county: z.string().min(1, 'Please select the California county'),
  marriage_date: z.string().optional().or(z.literal('')),
  separation_date: z.string().optional().or(z.literal('')),
  real_property: z.string().optional().or(z.literal('')),
  family_home: z.string().optional().or(z.literal('')),
  family_home_value: z.string().optional().or(z.literal('')),
  family_home_equity: z.string().optional().or(z.literal('')),
  personal_property: z.string().optional().or(z.literal('')),
  vehicles: z.string().optional().or(z.literal('')),
  bank_accounts: z.string().optional().or(z.literal('')),
  investment_accounts: z.string().optional().or(z.literal('')),
  retirement_accounts: z.string().optional().or(z.literal('')),
  qdro_required: z.boolean().optional(),
  business_interests: z.string().optional().or(z.literal('')),
  other_assets: z.string().optional().or(z.literal('')),
  debts: z.string().optional().or(z.literal('')),
  mortgage_balance: z.string().optional().or(z.literal('')),
  credit_card_debt: z.string().optional().or(z.literal('')),
  auto_loans: z.string().optional().or(z.literal('')),
  other_debts: z.string().optional().or(z.literal('')),
  division_method: z.string().optional().or(z.literal('')),
  buyout_amount: z.string().optional().or(z.literal('')),
  spousal_support_waiver: z.boolean().optional(),
  spousal_support_terms: z.string().optional().or(z.literal('')),
})

type FormData = z.infer<typeof propertySchema>

interface PropertySettlementFormWrapperProps {
  template: {
    id: string
    name: string
  }
}

const FIELD_LABELS: Record<string, string> = {
  party1_name: 'Party 1 Name',
  party1_address: 'Party 1 Address',
  party2_name: 'Party 2 Name',
  party2_address: 'Party 2 Address',
  county: 'County',
  marriage_date: 'Marriage Date',
  separation_date: 'Separation Date',
  family_home: 'Family Home Address',
  family_home_value: 'Home Value',
  family_home_equity: 'Home Equity',
  vehicles: 'Vehicles',
  bank_accounts: 'Bank Accounts',
  investment_accounts: 'Investment Accounts',
  retirement_accounts: 'Retirement Accounts',
  business_interests: 'Business Interests',
  mortgage_balance: 'Mortgage Balance',
  credit_card_debt: 'Credit Card Debt',
  division_method: 'Division Method',
  buyout_amount: 'Buyout Amount',
}

const PREVIEW_SECTIONS: Record<string, string[]> = {
  'Parties': ['party1_name', 'party1_address', 'party2_name', 'party2_address', 'county'],
  'Marriage Info': ['marriage_date', 'separation_date'],
  'Real Property': ['family_home', 'family_home_value', 'family_home_equity'],
  'Personal Property': ['vehicles', 'bank_accounts', 'investment_accounts', 'retirement_accounts', 'business_interests'],
  'Debts': ['mortgage_balance', 'credit_card_debt', 'auto_loans', 'other_debts'],
  'Division': ['division_method', 'buyout_amount'],
}

const STORAGE_KEY = 'property_settlement_draft'

export default function PropertySettlementFormWrapper({ template }: PropertySettlementFormWrapperProps) {
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
    resolver: zodResolver(propertySchema),
    defaultValues: {
      qdro_required: false,
      spousal_support_waiver: false,
      division_method: 'Equal (50/50) division',
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
        <p className="text-gray-600">Complete the form below to generate your property settlement agreement</p>
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
        {/* Party Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Party Information</h2>
          <div className="space-y-4">
            <div>
              <FieldLabel
                label="Party 1 Full Name"
                tooltip="Full legal name of the first party (Petitioner)"
                required
                htmlFor="party1_name"
              />
              <Input id="party1_name" {...register('party1_name')} placeholder="Jane Marie Smith" />
              {errors.party1_name && <p className="text-red-600 text-sm mt-1">{errors.party1_name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Party 1 Address</label>
              <Input {...register('party1_address')} placeholder="123 Main Street, Los Angeles, CA 90001" />
            </div>
            <div>
              <FieldLabel
                label="Party 2 Full Name"
                tooltip="Full legal name of the second party (Respondent)"
                required
                htmlFor="party2_name"
              />
              <Input id="party2_name" {...register('party2_name')} placeholder="John David Smith" />
              {errors.party2_name && <p className="text-red-600 text-sm mt-1">{errors.party2_name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Party 2 Address</label>
              <Input {...register('party2_address')} placeholder="456 Oak Avenue, Santa Monica, CA 90405" />
            </div>
            <div>
              <FieldLabel
                label="County"
                tooltip="California county where this agreement will be filed"
                required
                htmlFor="county"
              />
              <Input id="county" {...register('county')} placeholder="Los Angeles, Orange, San Diego, etc." />
              {errors.county && <p className="text-red-600 text-sm mt-1">{errors.county.message}</p>}
            </div>
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
          </div>
        </div>

        {/* Real Property */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Real Property</h2>
          <div className="space-y-4">
            <div>
              <FieldLabel
                label="Family Home Address"
                tooltip="The primary residence address. Include full street address, city, state, and ZIP."
                htmlFor="family_home"
              />
              <Input id="family_home" {...register('family_home')} placeholder="123 Main Street, Los Angeles, CA 90001" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Estimated Home Value</label>
                <Input {...register('family_home_value')} placeholder="$500,000" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Equity (Value - Mortgage)</label>
                <Input {...register('family_home_equity')} placeholder="$200,000" />
              </div>
            </div>
            <div>
              <FieldLabel
                label="Other Real Property"
                tooltip="List any other real estate: rental properties, vacation homes, land, etc."
                htmlFor="real_property"
              />
              <textarea
                id="real_property"
                {...register('real_property')}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                rows={2}
                placeholder="Example: Rental property at 789 Oak St, valued at $300,000"
              />
            </div>
          </div>
        </div>

        {/* Personal Property & Assets */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Personal Property & Financial Assets</h2>
          <div className="space-y-4">
            <div>
              <FieldLabel
                label="Vehicles"
                tooltip="List all vehicles with year, make, model, and approximate value. Include VIN if available."
                htmlFor="vehicles"
              />
              <textarea
                id="vehicles"
                {...register('vehicles')}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                rows={2}
                placeholder="Example: 2020 Honda Accord (VIN: XXX1234), value $25,000 - to Party 1&#10;2018 Ford F-150 (VIN: YYY5678), value $30,000 - to Party 2"
              />
            </div>
            <div>
              <FieldLabel
                label="Bank Accounts"
                tooltip="List bank accounts with institution name, last 4 digits of account number, and approximate balance."
                htmlFor="bank_accounts"
              />
              <textarea
                id="bank_accounts"
                {...register('bank_accounts')}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                rows={2}
                placeholder="Example: Chase checking (...4567), balance $15,000 - split 50/50&#10;Wells Fargo savings (...8910), balance $10,000 - to Party 1"
              />
            </div>
            <div>
              <FieldLabel
                label="Investment Accounts"
                tooltip="Brokerage accounts, stocks, bonds, mutual funds, etc."
                htmlFor="investment_accounts"
              />
              <textarea
                id="investment_accounts"
                {...register('investment_accounts')}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                rows={2}
                placeholder="Example: Vanguard brokerage (...1234), value $50,000 - split 50/50"
              />
            </div>
            <div>
              <FieldLabel
                label="Retirement Accounts"
                tooltip="401(k), IRA, pension, 403(b), etc. Include institution, account type, and approximate value."
                htmlFor="retirement_accounts"
              />
              <textarea
                id="retirement_accounts"
                {...register('retirement_accounts')}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                rows={2}
                placeholder="Example: Party 1's Fidelity 401(k), value $85,000 - split 50% to Party 2 via QDRO&#10;Party 2's IRA, value $40,000 - retained by Party 2"
              />
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input type="checkbox" {...register('qdro_required')} className="rounded" />
                <span className="text-sm">QDRO (Qualified Domestic Relations Order) required for retirement account division</span>
              </label>
            </div>
            <div>
              <FieldLabel
                label="Business Interests"
                tooltip="Any ownership in businesses, partnerships, LLCs, corporations, etc."
                htmlFor="business_interests"
              />
              <textarea
                id="business_interests"
                {...register('business_interests')}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                rows={2}
                placeholder="Example: 50% ownership in Smith Consulting LLC, valued at $100,000 - retained by Party 1"
              />
            </div>
            <div>
              <FieldLabel
                label="Other Assets"
                tooltip="Tax refunds, life insurance cash value, intellectual property, collectibles, etc."
                htmlFor="other_assets"
              />
              <textarea
                id="other_assets"
                {...register('other_assets')}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                rows={2}
                placeholder="Example: 2024 tax refund $3,000 - split 50/50, Life insurance policy cash value $5,000"
              />
            </div>
          </div>
        </div>

        {/* Debts */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Community Debts & Liabilities</h2>
          <div className="space-y-4">
            <div>
              <FieldLabel
                label="Mortgage Balance"
                tooltip="Current balance on home mortgage(s). Include lender name and account number (last 4 digits)."
                htmlFor="mortgage_balance"
              />
              <Input id="mortgage_balance" {...register('mortgage_balance')} placeholder="$300,000 (Wells Fargo ...4567)" />
            </div>
            <div>
              <FieldLabel
                label="Credit Card Debt"
                tooltip="List each credit card with issuer, last 4 digits, balance, and who will be responsible."
                htmlFor="credit_card_debt"
              />
              <textarea
                id="credit_card_debt"
                {...register('credit_card_debt')}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                rows={2}
                placeholder="Example: Chase Visa (...1234), balance $8,000 - Party 1 responsible&#10;Amex (...5678), balance $5,000 - Party 2 responsible"
              />
            </div>
            <div>
              <FieldLabel
                label="Auto Loans"
                tooltip="Vehicle loan balances, lender, account info, and who assumes responsibility."
                htmlFor="auto_loans"
              />
              <Input id="auto_loans" {...register('auto_loans')} placeholder="Honda loan $18,000 - Party 1, Ford loan $22,000 - Party 2" />
            </div>
            <div>
              <FieldLabel
                label="Other Debts"
                tooltip="Student loans, personal loans, medical bills, taxes owed, etc."
                htmlFor="other_debts"
              />
              <textarea
                id="other_debts"
                {...register('other_debts')}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                rows={2}
                placeholder="Example: Party 1's student loan $25,000 - retained by Party 1&#10;Medical bills $3,000 - split 50/50"
              />
            </div>
          </div>
        </div>

        {/* Division Terms */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Division Terms</h2>
          <div className="space-y-4">
            <div>
              <FieldLabel
                label="Division Method"
                tooltip="How property and debts will be divided. California law presumes equal (50/50) division."
                htmlFor="division_method"
              />
              <select
                id="division_method"
                {...register('division_method')}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              >
                <option value="Equal (50/50) division">Equal (50/50) division</option>
                <option value="Unequal division by agreement">Unequal division by agreement</option>
                <option value="One party buys out other">One party buys out the other</option>
              </select>
            </div>
            <div>
              <FieldLabel
                label="Buyout Amount (if applicable)"
                tooltip="If one party is buying out the other's interest in property, specify the amount."
                htmlFor="buyout_amount"
              />
              <Input id="buyout_amount" {...register('buyout_amount')} placeholder="$75,000" />
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input type="checkbox" {...register('spousal_support_waiver')} className="rounded" />
                <span className="text-sm">Both parties waive spousal support (mutual waiver)</span>
              </label>
            </div>
            <div>
              <FieldLabel
                label="Spousal Support Terms (if not waived)"
                tooltip="If spousal support is not waived, specify the terms: amount, duration, etc."
                htmlFor="spousal_support_terms"
              />
              <textarea
                id="spousal_support_terms"
                {...register('spousal_support_terms')}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                rows={2}
                placeholder="Example: Party 1 to pay Party 2 $2,000/month for 3 years"
              />
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
            <p className="text-sm text-gray-500 mb-4">Using AI to draft a court-ready settlement agreement</p>
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
