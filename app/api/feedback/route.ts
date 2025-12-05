import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { document_id, rating, would_recommend, suggestions } = body

    // Validate required fields
    if (!document_id || !rating || would_recommend === undefined || would_recommend === null) {
      return NextResponse.json(
        { error: 'Missing required fields: document_id, rating, would_recommend' },
        { status: 400 }
      )
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Verify that the document belongs to the user
    const { data: document, error: docError } = await supabase
      .from('generated_documents')
      .select('id, user_id')
      .eq('id', document_id)
      .single()

    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (document.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to provide feedback for this document' }, { status: 403 })
    }

    // Insert feedback
    const { data: feedback, error: insertError } = await supabase
      .from('feedback')
      .insert({
        document_id,
        user_id: user.id,
        rating,
        would_recommend,
        suggestions: suggestions || null,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Feedback insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      feedback,
    })

  } catch (error: any) {
    console.error('Feedback submission error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to submit feedback' },
      { status: 500 }
    )
  }
}
