-- Create document_templates table
CREATE TABLE IF NOT EXISTS document_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'California',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the 5 family law templates
INSERT INTO document_templates (id, name, description, category, state, is_active) VALUES
  (
    'custody-agreement',
    'Child Custody & Visitation Agreement',
    'Establish custody arrangements, visitation schedules, and parenting plans for minor children.',
    'custody',
    'California',
    true
  ),
  (
    'divorce-petition',
    'Divorce Petition (FL-100)',
    'File for divorce in California. Petition for Dissolution of Marriage including grounds, property, and children.',
    'divorce',
    'California',
    true
  ),
  (
    'property-settlement',
    'Property Settlement Agreement',
    'Divide marital assets and debts. Specify who gets the house, cars, bank accounts, and retirement funds.',
    'property',
    'California',
    true
  ),
  (
    'child-support',
    'Child Support Order',
    'Establish child support payments based on California guideline formula (FC § 4055).',
    'custody',
    'California',
    true
  ),
  (
    'spousal-support',
    'Spousal Support Order',
    'Request spousal support (alimony) based on Family Code § 4320 factors. Specify amount and duration.',
    'divorce',
    'California',
    true
  );

-- Enable Row Level Security
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

-- Create policy: Anyone can read active templates
CREATE POLICY "Anyone can read active templates"
  ON document_templates
  FOR SELECT
  USING (is_active = true);

-- Create policy: Only admins can modify templates (you can adjust this later)
CREATE POLICY "Only admins can modify templates"
  ON document_templates
  FOR ALL
  USING (false); -- No one can modify for now (you can change this later)
