'use client'

import { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { initAnalytics, trackPageView } from '@/lib/analytics'

function AnalyticsContent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Track page views on route changes
  useEffect(() => {
    if (pathname) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
      trackPageView(url)
    }
  }, [pathname, searchParams])

  return null
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  // Initialize PostHog on mount
  useEffect(() => {
    initAnalytics()
  }, [])

  return (
    <>
      <Suspense fallback={null}>
        <AnalyticsContent />
      </Suspense>
      {children}
    </>
  )
}
