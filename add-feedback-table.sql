-- Add feedback table to collect user feedback after document generation

CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES generated_documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  would_recommend BOOLEAN NOT NULL,
  suggestions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS feedback_document_id_idx ON feedback(document_id);
CREATE INDEX IF NOT EXISTS feedback_user_id_idx ON feedback(user_id);
CREATE INDEX IF NOT EXISTS feedback_created_at_idx ON feedback(created_at);

-- Enable RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can insert their own feedback
CREATE POLICY "Users can insert own feedback"
ON feedback FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can read their own feedback
CREATE POLICY "Users can read own feedback"
ON feedback FOR SELECT
USING (user_id = auth.uid());

-- Admins/org owners can read all feedback for their org's documents
CREATE POLICY "Org owners can read org feedback"
ON feedback FOR SELECT
USING (
  document_id IN (
    SELECT gd.id
    FROM generated_documents gd
    JOIN user_profiles up ON gd.organization_id = up.organization_id
    WHERE up.id = auth.uid() AND up.role = 'owner'
  )
);
