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

const propertySchema = z.object({
  party1_name: z.string().min(2, 'Please enter Party 1\'s full legal name as shown on the divorce petition'),
  party2_name: z.string().min(2, 'Please enter Party 2\'s full legal name as shown on the divorce petition'),
  county: z.string().min(1, 'Please select the California county where this agreement will be filed'),
  marriage_date: z.string().min(1, 'Please enter the date of marriage from your marriage certificate'),
  separation_date: z.string().min(1, 'Please enter the date when you began living separate and apart'),
  real_property: z.string().optional().or(z.literal('')),
  vehicles: z.string().optional().or(z.literal('')),
  bank_accounts: z.string().optional().or(z.literal('')),
  retirement_accounts: z.string().optional().or(z.literal('')),
  business_interests: z.string().optional().or(z.literal('')),
  personal_property: z.string().optional().or(z.literal('')),
  debts: z.string().optional().or(z.literal('')),
  spousal_support: z.string().min(1, 'Please select how spousal support will be handled (waived, reserved, or paid)'),
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

type FormData = z.infer<typeof propertySchema>

interface PropertySettlementFormProps {
  template: {
    id: string
    name: string
  }
}

const SPOUSAL_SUPPORT_OPTIONS = [
  'Waived by both parties',
  'Party 1 to pay Party 2',
  'Party 2 to pay Party 1',
  'Reserved',
]

const FIELD_LABELS: Record<string, string> = {
  party1_name: 'Party 1 Name',
  party2_name: 'Party 2 Name',
  county: 'County',
  marriage_date: 'Date of Marriage',
  separation_date: 'Date of Separation',
  real_property: 'Real Property',
  vehicles: 'Vehicles',
  bank_accounts: 'Bank Accounts',
  retirement_accounts: 'Retirement Accounts',
  business_interests: 'Business Interests',
  personal_property: 'Personal Property',
  debts: 'Community Debts',
  spousal_support: 'Spousal Support',
}

const PREVIEW_SECTIONS: Record<string, string[]> = {
  'Party Information': ['party1_name', 'party2_name', 'county', 'marriage_date', 'separation_date'],
  'Assets': ['real_property', 'vehicles', 'bank_accounts', 'retirement_accounts', 'business_interests', 'personal_property'],
  'Debts & Support': ['debts', 'spousal_support'],
}

export default function PropertySettlementForm({ template }: PropertySettlementFormProps) {
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
    resolver: zodResolver(propertySchema),
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
        <p className="text-gray-600">Complete the form below to generate your property settlement agreement</p>
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
                label="Party 1 Name"
                tooltip="Enter the full legal name of Party 1 (Petitioner) as it appears on official documents and the divorce petition."
                required
                htmlFor="party1_name"
              />
              <Input id="party1_name" {...register('party1_name')} placeholder="Example: Sarah Michelle Johnson" />
              {errors.party1_name && (
                <p className="text-red-600 text-sm mt-1">{errors.party1_name.message}</p>
              )}
            </div>
            <div>
              <FieldLabel
                label="Party 2 Name"
                tooltip="Enter the full legal name of Party 2 (Respondent) as it appears on official documents and the divorce petition."
                required
                htmlFor="party2_name"
              />
              <Input id="party2_name" {...register('party2_name')} placeholder="Example: Michael Robert Johnson" />
              {errors.party2_name && (
                <p className="text-red-600 text-sm mt-1">{errors.party2_name.message}</p>
              )}
            </div>
            <div>
              <FieldLabel
                label="County"
                tooltip="The California county where the property settlement agreement will be filed. This is typically the county where the dissolution petition was filed, which must be where at least one spouse has resided for 3+ months."
                required
                htmlFor="county"
              />
              <Input id="county" {...register('county')} placeholder="Los Angeles, Orange, San Diego, etc." />
              {errors.county && (
                <p className="text-red-600 text-sm mt-1">{errors.county.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel
                  label="Date of Marriage"
                  tooltip="The official date of marriage as shown on your marriage certificate. This date establishes when community property began accruing (assets/debts acquired after this date are presumed community property)."
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
                  tooltip="The date when spouses began living separately with intent to end the marriage. This date STOPS community property from accruing (assets/income after this date are separate property). CRITICAL: Must be after marriage date. This affects property characterization and spousal support duration."
                  required
                  htmlFor="separation_date"
                />
                <Input id="separation_date" {...register('separation_date')} type="date" />
                {errors.separation_date && (
                  <p className="text-red-600 text-sm mt-1">{errors.separation_date.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Assets */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Assets</h2>
          <div className="space-y-4">
            <div>
              <FieldLabel
                label="Real Property"
                tooltip="List all real estate owned during marriage (homes, land, rental properties). California presumes 50/50 division (FC § 2550). Include address, current value, equity, and who will receive it. If one party keeps the home, they typically must refinance to remove the other's name within 90 days."
                htmlFor="real_property"
              />
              <textarea
                id="real_property"
                {...register('real_property')}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                rows={3}
                placeholder="Example:&#10;• Family home at 123 Main St, Los Angeles CA 90001 - Value $650,000, Equity $200,000 - Award to Party 1, Party 1 to refinance within 90 days&#10;• Rental property at 456 Oak Ave - Value $300,000 - Award to Party 2"
              />
            </div>
            <div>
              <FieldLabel
                label="Vehicles"
                tooltip="List all vehicles (cars, trucks, motorcycles, boats, RVs) acquired during marriage. Include make, model, year, VIN (last 4 digits), current value, and who receives each vehicle. The person receiving a vehicle typically assumes any associated loan."
                htmlFor="vehicles"
              />
              <textarea
                id="vehicles"
                {...register('vehicles')}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                rows={2}
                placeholder="Example: 2020 Honda Accord (VIN: 1HGBH41J...4567) - Value $25,000 - Award to Party 1. 2018 Toyota Camry - Value $18,000 - Award to Party 2"
              />
            </div>
            <div>
              <FieldLabel
                label="Bank Accounts"
                tooltip="List all bank accounts (checking, savings, money market) opened during marriage. Include institution name, last 4 digits of account number, current balance, and division. Community property presumption is 50/50 unless otherwise agreed."
                htmlFor="bank_accounts"
              />
              <textarea
                id="bank_accounts"
                {...register('bank_accounts')}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                rows={2}
                placeholder="Example: Chase checking account (...4567) - Balance $15,000 - Split 50/50. Wells Fargo savings (...8901) - Balance $40,000 - Award to Party 2"
              />
            </div>
            <div>
              <FieldLabel
                label="Retirement Accounts"
                tooltip="List all retirement accounts (401k, IRA, pension, 403b) with contributions during marriage. Only the community portion (earned during marriage) is divisible. Division requires a Qualified Domestic Relations Order (QDRO) per FC § 2610. Include account type, institution, approximate value, and division terms."
                htmlFor="retirement_accounts"
              />
              <textarea
                id="retirement_accounts"
                {...register('retirement_accounts')}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                rows={2}
                placeholder="Example: Party 1 Fidelity 401(k) - Value $85,000 - Split 50/50 via QDRO. Party 2 Traditional IRA - Value $45,000 - Award to Party 2"
              />
            </div>
            <div>
              <FieldLabel
                label="Business Interests"
                tooltip="List any business ownership (sole proprietorship, partnership, LLC, corporation) acquired or grown during marriage. Include business name, ownership percentage, current valuation, and how it will be divided. Often one spouse keeps the business and pays a buyout to the other."
                htmlFor="business_interests"
              />
              <textarea
                id="business_interests"
                {...register('business_interests')}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                rows={2}
                placeholder="Example: ABC Consulting LLC - 50% ownership - Valued at $120,000 - Award to Party 1, Party 1 to pay Party 2 $30,000 buyout"
              />
            </div>
            <div>
              <FieldLabel
                label="Personal Property"
                tooltip="List household items, furniture, jewelry, electronics, collectibles, etc. For low-value items, parties often just divide by agreement. For high-value items (jewelry, art, antiques), include estimated values."
                htmlFor="personal_property"
              />
              <textarea
                id="personal_property"
                {...register('personal_property')}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                rows={2}
                placeholder="Example: Living room furniture to Party 1, bedroom furniture to Party 2, jewelry (wedding ring, watch) to Party 1, electronics split equally"
              />
            </div>
          </div>
        </div>

        {/* Debts */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Debts</h2>
          <div>
            <FieldLabel
              label="Community Debts"
              tooltip="List all debts incurred during marriage (mortgages, credit cards, auto loans, personal loans, medical bills). California law presumes 50/50 division of debts too. Include creditor name, account number (last 4 digits), balance, and who will pay. IMPORTANT: Include 'hold harmless' language so if one party doesn't pay, the other isn't responsible."
              htmlFor="debts"
            />
            <textarea
              id="debts"
              {...register('debts')}
              className="w-full px-3 py-2 border border-gray-300 rounded"
              rows={3}
              placeholder="Example:&#10;• Mortgage on family home - Balance $450,000 - Party 1 responsible (hold Party 2 harmless)&#10;• Chase credit card (...4567) - Balance $8,500 - Party 1 pays $4,250, Party 2 pays $4,250&#10;• Auto loan (Honda) - Balance $18,000 - Party 1 responsible"
            />
          </div>
        </div>

        {/* Spousal Support */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Spousal Support</h2>
          <div>
            <FieldLabel
              label="Spousal Support"
              tooltip="Choose how spousal support (alimony) will be handled. 'Waived' means neither party can request support later (cannot be changed). 'Reserved' means the court retains jurisdiction to award support in the future if circumstances change. Be very careful with waiver - consult an attorney."
              required
              htmlFor="spousal_support"
            />
            <select
              id="spousal_support"
              {...register('spousal_support')}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
              <option value="">Select an option</option>
              {SPOUSAL_SUPPORT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.spousal_support && (
              <p className="text-red-600 text-sm mt-1">{errors.spousal_support.message}</p>
            )}
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
            <p className="text-sm text-gray-500 mb-4">Using AI to draft a comprehensive property settlement agreement</p>
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
