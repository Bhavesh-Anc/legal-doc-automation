'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Check, Loader2, AlertCircle, Crown, Zap } from 'lucide-react'
import { SUBSCRIPTION_TIERS, formatPrice, canGenerateDocument } from '@/lib/stripe/config'

type SubscriptionTier = 'trial' | 'basic' | 'pro'

interface Organization {
  subscription_tier: SubscriptionTier
  subscription_status: string
  documents_used: number
  trial_ends_at: string | null
}

export default function BillingPage() {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchOrganization()
  }, [])

  async function fetchOrganization() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('Not authenticated')
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('organization_id, organizations(subscription_tier, subscription_status, documents_used, trial_ends_at)')
        .eq('id', user.id)
        .single()

      if (profile?.organizations) {
        setOrganization(profile.organizations as any)
      }

      setLoading(false)
    } catch (err) {
      console.error('Error fetching organization:', err)
      setError('Failed to load billing information')
      setLoading(false)
    }
  }

  async function handleUpgrade(tier: 'basic' | 'pro') {
    setCheckoutLoading(tier)
    setError(null)

    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Error creating checkout:', err)
      setError(err instanceof Error ? err.message : 'Failed to start checkout')
      setCheckoutLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Organization Not Found</h2>
        <p className="text-gray-600">Unable to load billing information</p>
      </div>
    )
  }

  const currentTier = organization.subscription_tier
  const documentsUsed = organization.documents_used || 0
  const limit = SUBSCRIPTION_TIERS[currentTier].documentsLimit
  const canGenerate = canGenerateDocument(currentTier, documentsUsed)

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-2">Billing & Subscription</h1>
      <p className="text-gray-600 mb-8">Manage your subscription and billing details</p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Current Plan */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold mb-1">Current Plan</h2>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-blue-600">
                {SUBSCRIPTION_TIERS[currentTier].name}
              </span>
              {currentTier !== 'trial' && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                  Active
                </span>
              )}
            </div>
          </div>
          {currentTier !== 'trial' && (
            <div className="text-right">
              <p className="text-2xl font-bold">
                {formatPrice(SUBSCRIPTION_TIERS[currentTier].price)}
              </p>
              <p className="text-sm text-gray-600">per month</p>
            </div>
          )}
        </div>

        {/* Usage */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Documents Used</span>
            <span className="text-sm font-semibold">
              {documentsUsed} / {limit === -1 ? '∞' : limit}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                canGenerate ? 'bg-blue-600' : 'bg-red-600'
              }`}
              style={{
                width: limit === -1 ? '50%' : `${Math.min((documentsUsed / limit) * 100, 100)}%`,
              }}
            />
          </div>
          {!canGenerate && currentTier === 'trial' && (
            <p className="text-sm text-red-600 mt-2">
              You've reached your document limit. Upgrade to continue generating documents.
            </p>
          )}
        </div>

        {/* Trial Expiry */}
        {currentTier === 'trial' && organization.trial_ends_at && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-amber-900">
              <strong>Trial expires:</strong>{' '}
              {new Date(organization.trial_ends_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        )}
      </div>

      {/* Pricing Plans */}
      <h2 className="text-2xl font-bold mb-6">
        {currentTier === 'trial' ? 'Upgrade Your Plan' : 'Available Plans'}
      </h2>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Basic Plan */}
        <div className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-6 hover:border-blue-400 transition-all">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-6 h-6 text-blue-600" />
            <h3 className="text-2xl font-bold">Basic</h3>
          </div>
          <div className="mb-4">
            <span className="text-4xl font-bold">{formatPrice(SUBSCRIPTION_TIERS.basic.price)}</span>
            <span className="text-gray-600">/month</span>
          </div>
          <ul className="space-y-3 mb-6">
            {SUBSCRIPTION_TIERS.basic.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
          <Button
            onClick={() => handleUpgrade('basic')}
            disabled={currentTier === 'basic' || currentTier === 'pro' || checkoutLoading !== null}
            className="w-full"
            variant={currentTier === 'trial' ? 'default' : 'outline'}
          >
            {checkoutLoading === 'basic' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : currentTier === 'basic' ? (
              'Current Plan'
            ) : currentTier === 'pro' ? (
              'Downgrade to Basic'
            ) : (
              'Upgrade to Basic'
            )}
          </Button>
        </div>

        {/* Pro Plan */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg shadow-lg border-2 border-blue-400 p-6 relative">
          <div className="absolute -top-3 right-6 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
            POPULAR
          </div>
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-6 h-6 text-blue-600" />
            <h3 className="text-2xl font-bold">Pro</h3>
          </div>
          <div className="mb-4">
            <span className="text-4xl font-bold">{formatPrice(SUBSCRIPTION_TIERS.pro.price)}</span>
            <span className="text-gray-600">/month</span>
          </div>
          <ul className="space-y-3 mb-6">
            {SUBSCRIPTION_TIERS.pro.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
          <Button
            onClick={() => handleUpgrade('pro')}
            disabled={currentTier === 'pro' || checkoutLoading !== null}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {checkoutLoading === 'pro' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : currentTier === 'pro' ? (
              'Current Plan'
            ) : (
              'Upgrade to Pro'
            )}
          </Button>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Frequently Asked Questions</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-1">Can I cancel anytime?</h4>
            <p className="text-sm text-gray-600">
              Yes! You can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">What happens when my trial ends?</h4>
            <p className="text-sm text-gray-600">
              Your account will be paused, but your documents will be saved. Upgrade anytime to continue creating documents.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Do unused documents roll over?</h4>
            <p className="text-sm text-gray-600">
              No, the document limit resets each month on your billing date. Pro plan has unlimited documents.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">What payment methods do you accept?</h4>
            <p className="text-sm text-gray-600">
              We accept all major credit cards through Stripe, our secure payment processor.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
