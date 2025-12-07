const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://svfjstczpuvnclvsmhks.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2ZmpzdGN6cHV2bmNsdnNtaGtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MTkzMDksImV4cCI6MjA3NjM5NTMwOX0.v0BjJJAK9GjmDTOWI5WxKitMsmubQCGwA8InhObzTVA'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testInsert() {
  console.log('🔍 Testing database insert...\n')

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError) {
    console.log('❌ Auth Error:', authError.message)
    console.log('You need to be logged in. This test requires a valid session.')
    return
  }

  console.log('✅ Authenticated as:', user.email)
  console.log('User ID:', user.id)

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('organization_id, organizations(subscription_tier, subscription_status, documents_used)')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.log('\n❌ Profile Error:', profileError.message)
    console.log('Details:', JSON.stringify(profileError, null, 2))
    return
  }

  if (!profile) {
    console.log('\n❌ No profile found for user')
    return
  }

  console.log('✅ Profile found')
  console.log('Organization ID:', profile.organization_id)
  console.log('Organization:', JSON.stringify(profile.organizations, null, 2))

  // Try to insert a test document
  console.log('\n🔍 Attempting to insert test document...\n')

  const testDoc = {
    organization_id: profile.organization_id,
    user_id: user.id,
    template_id: 'custody-agreement-ca',
    title: 'TEST DOCUMENT - DELETE ME',
    form_data: { test: 'data' },
    file_url: 'test/path/doc.docx',
    pdf_url: 'test/path/doc.pdf',
    file_size: 1000,
    status: 'generated'
  }

  console.log('Inserting:', JSON.stringify(testDoc, null, 2))

  const { data: documentRecord, error: dbError } = await supabase
    .from('generated_documents')
    .insert(testDoc)
    .select()
    .single()

  if (dbError) {
    console.log('\n❌ DATABASE INSERT ERROR:')
    console.log('Message:', dbError.message)
    console.log('Code:', dbError.code)
    console.log('Details:', dbError.details)
    console.log('Hint:', dbError.hint)
    console.log('\nFull error:', JSON.stringify(dbError, null, 2))
    return
  }

  console.log('\n✅ SUCCESS! Document inserted:')
  console.log('Document ID:', documentRecord.id)
  console.log('Full record:', JSON.stringify(documentRecord, null, 2))

  // Clean up - delete the test document
  console.log('\n🧹 Cleaning up test document...')
  await supabase
    .from('generated_documents')
    .delete()
    .eq('id', documentRecord.id)
  console.log('✅ Test document deleted')
}

testInsert().catch(err => {
  console.error('❌ Unexpected error:', err)
})
