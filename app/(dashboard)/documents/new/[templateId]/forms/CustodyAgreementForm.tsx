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

const custodySchema = z.object({
  parent1_name: z.string().min(2, 'Please enter Parent 1\'s full legal name (at least 2 characters)'),
  parent1_address: z.string().min(5, 'Please enter Parent 1\'s complete address (street, city, state, ZIP)'),
  parent1_phone: z.string().min(10, 'Please enter a valid phone number (at least 10 digits)'),
  parent2_name: z.string().min(2, 'Please enter Parent 2\'s full legal name (at least 2 characters)'),
  parent2_address: z.string().min(5, 'Please enter Parent 2\'s complete address (street, city, state, ZIP)'),
  parent2_phone: z.string().min(10, 'Please enter a valid phone number (at least 10 digits)'),
  county: z.string().min(1, 'Please select the California county where the agreement will be filed'),
  children_info: z.string().min(10, 'Please list all children with their full names, birthdates, and ages'),
  custody_type: z.string().min(1, 'Please select a custody arrangement (joint or sole, legal and/or physical)'),
  regular_schedule: z.string().min(20, 'Please provide a detailed weekly parenting schedule with specific days and times'),
  holiday_schedule: z.string().optional().or(z.literal('')),
  summer_schedule: z.string().optional().or(z.literal('')),
  exchange_location: z.string().optional().or(z.literal('')),
  transportation: z.string().optional().or(z.literal('')),
  communication: z.string().optional().or(z.literal('')),
  relocation_distance: z.string().optional().or(z.literal('')),
})

type FormData = z.infer<typeof custodySchema>

interface CustodyAgreementFormProps {
  template: {
    id: string
    name: string
  }
}

const CUSTODY_TYPES = [
  'Joint Legal and Physical',
  'Joint Legal, Primary Physical to Parent 1',
  'Joint Legal, Primary Physical to Parent 2',
  'Sole Legal and Physical to Parent 1',
  'Sole Legal and Physical to Parent 2',
]

const FIELD_LABELS: Record<string, string> = {
  parent1_name: 'Parent 1 Full Name',
  parent1_address: 'Parent 1 Address',
  parent1_phone: 'Parent 1 Phone',
  parent2_name: 'Parent 2 Full Name',
  parent2_address: 'Parent 2 Address',
  parent2_phone: 'Parent 2 Phone',
  county: 'County',
  children_info: 'Children Information',
  custody_type: 'Custody Type',
  regular_schedule: 'Regular Parenting Schedule',
  holiday_schedule: 'Holiday Schedule',
  summer_schedule: 'Summer Schedule',
  exchange_location: 'Exchange Location',
  transportation: 'Transportation',
  communication: 'Communication',
  relocation_distance: 'Relocation Distance',
}

const PREVIEW_SECTIONS: Record<string, string[]> = {
  'Parent 1 Information': ['parent1_name', 'parent1_address', 'parent1_phone'],
  'Parent 2 Information': ['parent2_name', 'parent2_address', 'parent2_phone'],
  'Case Details': ['county', 'children_info', 'custody_type'],
  'Visitation Schedule': ['regular_schedule', 'holiday_schedule', 'summer_schedule', 'exchange_location', 'transportation', 'communication', 'relocation_distance'],
}

export default function CustodyAgreementForm({ template }: CustodyAgreementFormProps) {
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
    resolver: zodResolver(custodySchema),
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
        <p className="text-gray-600">Complete the form below to generate your custody agreement</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onPreview)} className="space-y-8">
        {/* Parent 1 Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Parent 1 Information</h2>
          <div className="space-y-4">
            <div>
              <FieldLabel
                label="Full Name"
                tooltip="Enter the full legal name of Parent 1 (Petitioner) as it appears on official documents like driver's license or birth certificate."
                required
                htmlFor="parent1_name"
              />
              <Input id="parent1_name" {...register('parent1_name')} placeholder="Example: Jane Marie Smith" />
              {errors.parent1_name && (
                <p className="text-red-600 text-sm mt-1">{errors.parent1_name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Address *</label>
              <Input {...register('parent1_address')} placeholder="123 Main Street, Los Angeles, CA 90001" />
              {errors.parent1_address && (
                <p className="text-red-600 text-sm mt-1">{errors.parent1_address.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone *</label>
              <Input {...register('parent1_phone')} type="tel" placeholder="(555) 123-4567" />
              {errors.parent1_phone && (
                <p className="text-red-600 text-sm mt-1">{errors.parent1_phone.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Parent 2 Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Parent 2 Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name *</label>
              <Input {...register('parent2_name')} placeholder="Example: John David Smith" />
              {errors.parent2_name && (
                <p className="text-red-600 text-sm mt-1">{errors.parent2_name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Address *</label>
              <Input {...register('parent2_address')} placeholder="456 Oak Avenue, Santa Monica, CA 90405" />
              {errors.parent2_address && (
                <p className="text-red-600 text-sm mt-1">{errors.parent2_address.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone *</label>
              <Input {...register('parent2_phone')} type="tel" placeholder="(555) 987-6543" />
              {errors.parent2_phone && (
                <p className="text-red-600 text-sm mt-1">{errors.parent2_phone.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Case Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Case Details</h2>
          <div className="space-y-4">
            <div>
              <FieldLabel
                label="County"
                tooltip="The California county where the custody agreement will be filed. This is typically the county where the children primarily reside."
                required
                htmlFor="county"
              />
              <Input id="county" {...register('county')} placeholder="Los Angeles, Orange, San Diego, etc." />
              {errors.county && (
                <p className="text-red-600 text-sm mt-1">{errors.county.message}</p>
              )}
            </div>
            <div>
              <FieldLabel
                label="Children Information"
                tooltip="List all minor children (under 18) who are subject to this custody agreement. Include their full legal names, dates of birth, and current ages. This information is used to establish jurisdiction under UCCJEA."
                required
                htmlFor="children_info"
              />
              <textarea
                id="children_info"
                {...register('children_info')}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                rows={3}
                placeholder="Example:&#10;• Emma Jane Smith - DOB: 05/15/2015, Age 8&#10;• Noah Michael Smith - DOB: 03/20/2018, Age 5&#10;List each child's full name, date of birth, and current age"
              />
              {errors.children_info && (
                <p className="text-red-600 text-sm mt-1">{errors.children_info.message}</p>
              )}
            </div>
            <div>
              <FieldLabel
                label="Custody Type"
                tooltip="Legal Custody = decision-making authority for education, healthcare, religion. Physical Custody = where children primarily live. 'Joint' means both parents share. 'Sole' means one parent has exclusive rights."
                required
                htmlFor="custody_type"
              />
              <select
                id="custody_type"
                {...register('custody_type')}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              >
                <option value="">Select custody type</option>
                {CUSTODY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.custody_type && (
                <p className="text-red-600 text-sm mt-1">{errors.custody_type.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Visitation Schedule */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Visitation Schedule</h2>
          <div className="space-y-4">
            <div>
              <FieldLabel
                label="Regular Schedule"
                tooltip="Specify the weekly parenting time schedule including specific days and times. Be as detailed as possible with pick-up and drop-off times. The court prefers specific schedules over vague terms like 'reasonable visitation'."
                required
                htmlFor="regular_schedule"
              />
              <textarea
                id="regular_schedule"
                {...register('regular_schedule')}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                rows={4}
                placeholder="Example: Parent 1 has parenting time Monday 3pm through Wednesday 8am. Parent 2 has parenting time Wednesday 3pm through Monday 8am. Alternating weekends Friday 6pm to Sunday 6pm."
              />
              {errors.regular_schedule && (
                <p className="text-red-600 text-sm mt-1">{errors.regular_schedule.message}</p>
              )}
            </div>
            <div>
              <FieldLabel
                label="Holiday Schedule"
                tooltip="Specify how major holidays will be divided between parents. Common approach is to alternate holidays by even/odd years. Include specific times and which holidays take priority over regular schedule."
                htmlFor="holiday_schedule"
              />
              <textarea
                id="holiday_schedule"
                {...register('holiday_schedule')}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                rows={3}
                placeholder="Example: Thanksgiving (even years with Parent 1, odd with Parent 2), Christmas Eve with Parent 1, Christmas Day with Parent 2, alternating each year. Specify times like 9am to 9am next day."
              />
            </div>
            <div>
              <FieldLabel
                label="Summer Schedule"
                tooltip="Define vacation time during summer break. Typically each parent gets 1-2 weeks of uninterrupted time. Include advance notice requirements (usually 30-60 days) to allow the other parent to plan."
                htmlFor="summer_schedule"
              />
              <textarea
                id="summer_schedule"
                {...register('summer_schedule')}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                rows={3}
                placeholder="Example: Each parent gets two non-consecutive weeks during summer break with 30 days advance notice. Regular schedule continues when not on vacation."
              />
            </div>
            <div>
              <FieldLabel
                label="Exchange Location"
                tooltip="Specify a neutral, public location for custody exchanges (school, daycare, public parking lot). This helps reduce conflict. For cooperative parents, exchanges at each parent's home may work."
                htmlFor="exchange_location"
              />
              <Input
                id="exchange_location"
                {...register('exchange_location')}
                placeholder="Example: Target parking lot at 123 Main St, or at each parent's residence"
              />
            </div>
            <div>
              <FieldLabel
                label="Transportation"
                tooltip="Define who is responsible for transportation during custody exchanges. Common arrangements: picking-up parent provides transport, or parents meet halfway, or each parent drives to/from exchange location."
                htmlFor="transportation"
              />
              <Input
                id="transportation"
                {...register('transportation')}
                placeholder="Example: Parent 1 picks up, Parent 2 returns; or each parent drives to exchange location"
              />
            </div>
            <div>
              <FieldLabel
                label="Communication"
                tooltip="Children have the right to communicate with both parents. Specify phone/video call schedules, duration, and times. Reasonable electronic communication should be allowed unless there are safety concerns."
                htmlFor="communication"
              />
              <textarea
                id="communication"
                {...register('communication')}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                rows={2}
                placeholder="Example: Children may call either parent daily between 7-8pm for 15 minutes. Video calls allowed twice weekly."
              />
            </div>
            <div>
              <FieldLabel
                label="Relocation Distance"
                tooltip="Move-away restrictions prevent one parent from relocating far away without court approval. California Family Code § 7501 requires 45-day written notice before any move. Specify distance limit (e.g., 50 miles, or must stay in county)."
                htmlFor="relocation_distance"
              />
              <Input
                id="relocation_distance"
                {...register('relocation_distance')}
                placeholder="Example: 50 miles from current residence, or must remain in Los Angeles County"
              />
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
            <p className="text-sm text-gray-500 mb-4">Using AI to draft a court-ready custody agreement</p>
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
