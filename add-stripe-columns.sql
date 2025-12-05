-- Add Stripe and usage tracking columns to organizations table
-- Run this in Supabase SQL Editor

-- Add columns if they don't exist
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS documents_used INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer
ON organizations(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_organizations_stripe_subscription
ON organizations(stripe_subscription_id);

-- Update existing organizations to have 0 documents_used if NULL
UPDATE organizations
SET documents_used = 0
WHERE documents_used IS NULL;

-- Add comment to document usage column
COMMENT ON COLUMN organizations.documents_used IS 'Number of documents generated in current billing period';
COMMENT ON COLUMN organizations.stripe_customer_id IS 'Stripe customer ID for billing';
COMMENT ON COLUMN organizations.stripe_subscription_id IS 'Stripe subscription ID';

-- Verify changes
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'organizations'
AND column_name IN ('documents_used', 'stripe_customer_id', 'stripe_subscription_id');
