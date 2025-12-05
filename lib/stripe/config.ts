import Stripe from 'stripe'

// Initialize Stripe with secret key
// Use a placeholder during build if not configured
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2025-11-17.clover',
  typescript: true,
})

// Subscription tier configuration
export const SUBSCRIPTION_TIERS = {
  trial: {
    name: 'Trial',
    price: 0,
    priceId: null,
    documentsLimit: 3,
    features: [
      '3 free documents',
      '7 day access',
      'All document templates',
      'AI-powered generation',
      'Download in DOCX format',
    ],
  },
  basic: {
    name: 'Basic',
    price: 2900, // $29.00 in cents
    priceId: process.env.STRIPE_BASIC_PRICE_ID,
    documentsLimit: 10,
    features: [
      '10 documents per month',
      'All document templates',
      'AI-powered generation',
      'Download in DOCX & PDF',
      'Email support',
      'Priority processing',
    ],
  },
  pro: {
    name: 'Pro',
    price: 9900, // $99.00 in cents
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    documentsLimit: -1, // Unlimited
    features: [
      'Unlimited documents',
      'All document templates',
      'Priority AI generation',
      'Download in DOCX & PDF',
      'Attorney review option',
      'Priority email support',
      'API access (coming soon)',
      'Custom branding (coming soon)',
    ],
  },
} as const

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS

// Helper to get tier limits
export function getDocumentLimit(tier: SubscriptionTier): number {
  return SUBSCRIPTION_TIERS[tier].documentsLimit
}

// Helper to check if user can generate document
export function canGenerateDocument(
  tier: SubscriptionTier,
  documentsUsed: number
): boolean {
  const limit = getDocumentLimit(tier)
  if (limit === -1) return true // Unlimited
  return documentsUsed < limit
}

// Helper to format price
export function formatPrice(priceInCents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(priceInCents / 100)
}
