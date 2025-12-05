'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface SpousalSupportFormWrapperProps {
  template: {
    id: string
    name: string
  }
}

export default function SpousalSupportFormWrapper({ template }: SpousalSupportFormWrapperProps) {
  const router = useRouter()

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{template.name}</h2>
        <p className="text-gray-700 mb-6">
          This form is being updated to support the new no-signup-required flow.
          Please use the authenticated version for now.
        </p>
        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={() => router.push('/start')}>
            ← Back to Templates
          </Button>
          <Button onClick={() => router.push(`/documents/new/${template.id}`)}>
            Use Authenticated Version
          </Button>
        </div>
      </div>
    </div>
  )
}
