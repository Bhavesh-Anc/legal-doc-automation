-- Insert Document Templates - CORRECT VERSION
-- Matches your actual table structure: state, is_active, form_schema, prompt_template

-- Delete existing templates first
DELETE FROM document_templates WHERE id IN (
  'divorce-petition-ca',
  'custody-agreement-ca',
  'property-settlement-ca',
  'child-support-ca',
  'spousal-support-ca'
);

-- Insert all document templates with correct column names
INSERT INTO document_templates (
  id,
  name,
  description,
  category,
  state,
  is_active,
  form_schema,
  prompt_template,
  estimated_time
)
VALUES
  -- 1. Divorce Petition
  (
    'divorce-petition-ca',
    'Petition for Dissolution of Marriage',
    'California petition for divorce (Form FL-100). Initiates dissolution proceedings with jurisdictional statements and relief requested.',
    'divorce',
    'California',
    true,
    '{
      "fields": [
        {"name": "petitioner_name", "label": "Petitioner Name", "type": "text", "required": true},
        {"name": "petitioner_address", "label": "Petitioner Address", "type": "text", "required": true},
        {"name": "petitioner_phone", "label": "Petitioner Phone", "type": "tel", "required": false},
        {"name": "petitioner_email", "label": "Petitioner Email", "type": "email", "required": false},
        {"name": "respondent_name", "label": "Respondent Name", "type": "text", "required": true},
        {"name": "respondent_address", "label": "Respondent Address", "type": "text", "required": false},
        {"name": "marriage_date", "label": "Date of Marriage", "type": "date", "required": true},
        {"name": "separation_date", "label": "Date of Separation", "type": "date", "required": true},
        {"name": "county", "label": "County", "type": "text", "required": true},
        {"name": "children", "label": "Minor Children?", "type": "boolean", "required": true},
        {"name": "property", "label": "Community Property?", "type": "boolean", "required": true}
      ]
    }'::jsonb,
    'Generate a California Petition for Dissolution of Marriage (Form FL-100)',
    '15-20 minutes'
  ),

  -- 2. Child Custody Agreement
  (
    'custody-agreement-ca',
    'Child Custody and Visitation Agreement',
    'California child custody agreement (Form FL-311). Establishes legal and physical custody arrangements, visitation schedules, and parenting plan.',
    'custody',
    'California',
    true,
    '{
      "fields": [
        {"name": "parent1_name", "label": "Parent 1 Name", "type": "text", "required": true},
        {"name": "parent1_address", "label": "Parent 1 Address", "type": "text", "required": true},
        {"name": "parent1_phone", "label": "Parent 1 Phone", "type": "tel", "required": true},
        {"name": "parent2_name", "label": "Parent 2 Name", "type": "text", "required": true},
        {"name": "parent2_address", "label": "Parent 2 Address", "type": "text", "required": true},
        {"name": "parent2_phone", "label": "Parent 2 Phone", "type": "tel", "required": true},
        {"name": "county", "label": "County", "type": "text", "required": true},
        {"name": "children_info", "label": "Children Information", "type": "textarea", "required": true},
        {"name": "custody_type", "label": "Custody Type", "type": "select", "required": true},
        {"name": "regular_schedule", "label": "Regular Schedule", "type": "textarea", "required": true}
      ]
    }'::jsonb,
    'Generate a California Child Custody and Visitation Agreement (Form FL-311)',
    '20-25 minutes'
  ),

  -- 3. Property Settlement Agreement
  (
    'property-settlement-ca',
    'Property Settlement Agreement',
    'California marital property settlement agreement. Divides community property, assets, debts, and addresses spousal support.',
    'property',
    'California',
    true,
    '{
      "fields": [
        {"name": "party1_name", "label": "Party 1 Name", "type": "text", "required": true},
        {"name": "party2_name", "label": "Party 2 Name", "type": "text", "required": true},
        {"name": "county", "label": "County", "type": "text", "required": true},
        {"name": "marriage_date", "label": "Date of Marriage", "type": "date", "required": true},
        {"name": "separation_date", "label": "Date of Separation", "type": "date", "required": true},
        {"name": "real_property", "label": "Real Property", "type": "textarea", "required": false},
        {"name": "vehicles", "label": "Vehicles", "type": "textarea", "required": false},
        {"name": "bank_accounts", "label": "Bank Accounts", "type": "textarea", "required": false},
        {"name": "retirement_accounts", "label": "Retirement Accounts", "type": "textarea", "required": false},
        {"name": "debts", "label": "Debts", "type": "textarea", "required": false},
        {"name": "spousal_support", "label": "Spousal Support", "type": "select", "required": true}
      ]
    }'::jsonb,
    'Generate a California Property Settlement Agreement',
    '25-30 minutes'
  ),

  -- 4. Child Support Order
  (
    'child-support-ca',
    'Child Support Order',
    'California child support order (Form FL-150 related). Calculates guideline child support based on income and timeshare.',
    'support',
    'California',
    true,
    '{
      "fields": [
        {"name": "paying_parent", "label": "Paying Parent Name", "type": "text", "required": true},
        {"name": "receiving_parent", "label": "Receiving Parent Name", "type": "text", "required": true},
        {"name": "county", "label": "County", "type": "text", "required": true},
        {"name": "number_of_children", "label": "Number of Children", "type": "number", "required": true},
        {"name": "children_info", "label": "Children Information", "type": "textarea", "required": true},
        {"name": "paying_parent_income", "label": "Paying Parent Income", "type": "text", "required": true},
        {"name": "receiving_parent_income", "label": "Receiving Parent Income", "type": "text", "required": true},
        {"name": "timeshare", "label": "Timeshare Percentage", "type": "text", "required": true},
        {"name": "payment_method", "label": "Payment Method", "type": "select", "required": true},
        {"name": "payment_day", "label": "Payment Day", "type": "number", "required": true}
      ]
    }'::jsonb,
    'Generate a California Child Support Order (Form FL-150 related)',
    '15-20 minutes'
  ),

  -- 5. Spousal Support Order
  (
    'spousal-support-ca',
    'Spousal Support Order',
    'California spousal support (alimony) order (Form FL-157 related). Establishes support amount, duration, and termination conditions based on FC §4320 factors.',
    'support',
    'California',
    true,
    '{
      "fields": [
        {"name": "paying_spouse", "label": "Paying Spouse Name", "type": "text", "required": true},
        {"name": "receiving_spouse", "label": "Receiving Spouse Name", "type": "text", "required": true},
        {"name": "county", "label": "County", "type": "text", "required": true},
        {"name": "marriage_date", "label": "Date of Marriage", "type": "date", "required": true},
        {"name": "separation_date", "label": "Date of Separation", "type": "date", "required": true},
        {"name": "marriage_length", "label": "Length of Marriage", "type": "text", "required": true},
        {"name": "paying_spouse_income", "label": "Paying Spouse Income", "type": "text", "required": true},
        {"name": "receiving_spouse_income", "label": "Receiving Spouse Income", "type": "text", "required": true},
        {"name": "support_amount", "label": "Support Amount", "type": "text", "required": true},
        {"name": "support_duration", "label": "Support Duration", "type": "text", "required": true},
        {"name": "payment_method", "label": "Payment Method", "type": "select", "required": true},
        {"name": "payment_day", "label": "Payment Day", "type": "number", "required": true}
      ]
    }'::jsonb,
    'Generate a California Spousal Support Order (Form FL-157 related)',
    '20-25 minutes'
  );

-- Verify insertion
SELECT id, name, category, state, is_active, estimated_time
FROM document_templates
ORDER BY category, name;
