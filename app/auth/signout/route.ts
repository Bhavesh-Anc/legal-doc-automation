import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()

  // Sign out from Supabase
  await supabase.auth.signOut()

  // Redirect to home page
  return NextResponse.redirect(new URL('/', request.url))
}

// Also support GET for convenience
export async function GET(request: NextRequest) {
  const supabase = createClient()

  // Sign out from Supabase
  await supabase.auth.signOut()

  // Redirect to home page
  return NextResponse.redirect(new URL('/', request.url))
}
