'use client'

import { useEffect } from 'react'
import { analytics } from '@/lib/analytics'

export function DashboardTracker() {
  useEffect(() => {
    analytics.dashboardViewed()
  }, [])

  return null
}
