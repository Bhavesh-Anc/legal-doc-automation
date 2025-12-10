// Analytics utility for tracking user behavior and conversions
import posthog from 'posthog-js'

export const initAnalytics = () => {
  if (typeof window !== 'undefined') {
    // Only initialize if we have the API key
    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'

    if (apiKey) {
      posthog.init(apiKey, {
        api_host: host,
        // Automatically capture pageviews
        capture_pageview: true,
        // Automatically capture clicks
        autocapture: true,
        // Disable in development
        loaded: (posthog) => {
          if (process.env.NODE_ENV === 'development') {
            posthog.opt_out_capturing()
          }
        },
      })
    }
  }
}

// Track custom events
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (typeof window !== 'undefined' && posthog.__loaded) {
    posthog.capture(eventName, properties)
  }
}

// Identify user (call after login/signup)
export const identifyUser = (userId: string, traits?: Record<string, any>) => {
  if (typeof window !== 'undefined' && posthog.__loaded) {
    posthog.identify(userId, traits)
  }
}

// Reset user (call on logout)
export const resetUser = () => {
  if (typeof window !== 'undefined' && posthog.__loaded) {
    posthog.reset()
  }
}

// Track page views manually (if needed)
export const trackPageView = (path?: string) => {
  if (typeof window !== 'undefined' && posthog.__loaded) {
    posthog.capture('$pageview', {
      $current_url: path || window.location.href,
    })
  }
}

// Common events to track
export const analytics = {
  // Landing page events
  landingPageViewed: () => trackEvent('Landing Page Viewed'),
  ctaClicked: (ctaText: string, location: string) =>
    trackEvent('CTA Clicked', { cta_text: ctaText, location }),

  // Form events
  formStarted: (templateId: string, templateName: string) =>
    trackEvent('Form Started', { template_id: templateId, template_name: templateName }),
  formFieldFilled: (templateId: string, fieldName: string) =>
    trackEvent('Form Field Filled', { template_id: templateId, field_name: fieldName }),
  formCompleted: (templateId: string, templateName: string, completionTime: number) =>
    trackEvent('Form Completed', {
      template_id: templateId,
      template_name: templateName,
      completion_time_seconds: completionTime,
    }),
  formAbandoned: (templateId: string, progress: number) =>
    trackEvent('Form Abandoned', { template_id: templateId, progress_percentage: progress }),

  // Auth events
  signupStarted: () => trackEvent('Signup Started'),
  signupCompleted: (method: 'password' | 'magic_link') =>
    trackEvent('Signup Completed', { method }),
  loginStarted: () => trackEvent('Login Started'),
  loginCompleted: (method: 'password' | 'magic_link') =>
    trackEvent('Login Completed', { method }),
  logoutCompleted: () => trackEvent('Logout Completed'),

  // Document events
  documentGenerated: (templateId: string, templateName: string, generationTime: number) =>
    trackEvent('Document Generated', {
      template_id: templateId,
      template_name: templateName,
      generation_time_seconds: generationTime,
    }),
  documentDownloaded: (documentId: string, format: 'pdf' | 'docx') =>
    trackEvent('Document Downloaded', { document_id: documentId, format }),
  documentShared: (documentId: string) => trackEvent('Document Shared', { document_id: documentId }),
  documentEdited: (documentId: string) => trackEvent('Document Edited', { document_id: documentId }),

  // Dashboard events
  dashboardViewed: () => trackEvent('Dashboard Viewed'),
  templateSelected: (templateId: string, templateName: string) =>
    trackEvent('Template Selected', { template_id: templateId, template_name: templateName }),

  // Conversion events
  trialStarted: () => trackEvent('Trial Started'),
  upgradeViewed: () => trackEvent('Upgrade Page Viewed'),
  upgradeCompleted: (plan: string, amount: number) =>
    trackEvent('Upgrade Completed', { plan, amount }),

  // Engagement events
  helpArticleViewed: (articleTitle: string) =>
    trackEvent('Help Article Viewed', { article_title: articleTitle }),
  feedbackSubmitted: (rating: number, feedback?: string) =>
    trackEvent('Feedback Submitted', { rating, feedback }),
  exitIntentShown: () => trackEvent('Exit Intent Popup Shown'),
  exitIntentClosed: () => trackEvent('Exit Intent Popup Closed'),
}
