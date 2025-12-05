import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, SUBSCRIPTION_TIERS } from '@/lib/stripe/config'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile and organization
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('organization_id, full_name, email, organizations(stripe_customer_id)')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Parse request body
    const { tier } = await request.json()

    // Validate tier
    if (tier !== 'basic' && tier !== 'pro') {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }

    const tierConfig = SUBSCRIPTION_TIERS[tier as 'basic' | 'pro']
    const priceId = tierConfig.priceId

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID not configured for this tier' },
        { status: 500 }
      )
    }

    // Get or create Stripe customer
    let customerId = (profile.organizations as any)?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email,
        name: profile.full_name || undefined,
        metadata: {
          organization_id: profile.organization_id,
          user_id: user.id,
        },
      })

      customerId = customer.id

      // Save customer ID to organization
      await supabase
        .from('organizations')
        .update({ stripe_customer_id: customerId })
        .eq('id', profile.organization_id)
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
      metadata: {
        organization_id: profile.organization_id,
        tier: tier,
      },
      subscription_data: {
        metadata: {
          organization_id: profile.organization_id,
          tier: tier,
        },
      },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
