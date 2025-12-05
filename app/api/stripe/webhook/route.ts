import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/config'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const organizationId = session.metadata?.organization_id
        const tier = session.metadata?.tier
        const subscriptionId = session.subscription as string

        if (organizationId && tier) {
          // Update organization with subscription info
          await supabase
            .from('organizations')
            .update({
              subscription_tier: tier as 'basic' | 'pro',
              subscription_status: 'active',
              stripe_subscription_id: subscriptionId,
              documents_used: 0, // Reset usage on new subscription
            })
            .eq('id', organizationId)

          console.log(
            `Subscription activated for organization ${organizationId}: ${tier}`
          )
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const organizationId = subscription.metadata?.organization_id

        if (organizationId) {
          const status = subscription.status
          const tier = subscription.metadata?.tier

          await supabase
            .from('organizations')
            .update({
              subscription_status: status as 'active' | 'cancelled' | 'past_due',
              subscription_tier: (tier as 'basic' | 'pro') || 'trial',
            })
            .eq('id', organizationId)

          console.log(
            `Subscription updated for organization ${organizationId}: ${status}`
          )
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const organizationId = subscription.metadata?.organization_id

        if (organizationId) {
          // Revert to trial tier when subscription is canceled
          await supabase
            .from('organizations')
            .update({
              subscription_tier: 'trial',
              subscription_status: 'cancelled',
              stripe_subscription_id: null,
            })
            .eq('id', organizationId)

          console.log(
            `Subscription cancelled for organization ${organizationId}`
          )
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any
        const subscriptionId = typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription?.id

        if (subscriptionId) {
          // Payment successful - reset monthly usage counter
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const organizationId = subscription.metadata?.organization_id

          if (organizationId) {
            await supabase
              .from('organizations')
              .update({
                documents_used: 0, // Reset monthly usage
                subscription_status: 'active',
              })
              .eq('id', organizationId)

            console.log(`Payment succeeded for organization ${organizationId}`)
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any
        const subscriptionId = typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription?.id

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const organizationId = subscription.metadata?.organization_id

          if (organizationId) {
            await supabase
              .from('organizations')
              .update({
                subscription_status: 'past_due',
              })
              .eq('id', organizationId)

            console.log(`Payment failed for organization ${organizationId}`)
          }
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
