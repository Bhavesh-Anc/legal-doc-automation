import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateWithAI, AIProvider } from '@/lib/ai-provider'
import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'
import { canGenerateDocument, getDocumentLimit, type SubscriptionTier } from '@/lib/stripe/config'
import { generatePDF, shouldAddWatermark, getWatermarkText } from '@/lib/pdf/generator'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile with organization
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('organization_id, organizations(subscription_tier, subscription_status, documents_used)')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check subscription and usage limits
    const organization = profile.organizations as any
    const tier = (organization?.subscription_tier || 'trial') as SubscriptionTier
    const documentsUsed = organization?.documents_used || 0
    const subscriptionStatus = organization?.subscription_status || 'active'

    // Block if subscription is cancelled or past_due
    if (subscriptionStatus === 'cancelled' || subscriptionStatus === 'past_due') {
      return NextResponse.json(
        {
          error: 'Your subscription is not active. Please update your payment method or resubscribe.',
          code: 'SUBSCRIPTION_INACTIVE',
        },
        { status: 403 }
      )
    }

    // Check if user can generate document based on tier and usage
    if (!canGenerateDocument(tier, documentsUsed)) {
      const limit = getDocumentLimit(tier)
      return NextResponse.json(
        {
          error: `You've reached your document limit (${limit} documents). Please upgrade your plan to continue.`,
          code: 'LIMIT_REACHED',
          currentUsage: documentsUsed,
          limit: limit,
          tier: tier,
        },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { template_id, form_data, ai_provider } = body

    // Fetch template from database
    const { data: template, error: templateError } = await supabase
      .from('document_templates')
      .select('*')
      .eq('id', template_id)
      .single()

    if (templateError || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Determine AI provider (from request, env, or default to test)
    const provider: AIProvider = ai_provider ||
      (process.env.AI_PROVIDER as AIProvider) ||
      'test'

    // Build prompts
    const systemPrompt = 'You are an experienced California family law attorney with 15+ years of practice. Generate legally accurate, court-ready documents using formal legal language. Use proper legal citation format and maintain a professional, assertive but not antagonistic tone.'
    const userPrompt = buildPrompt(template, form_data)

    // Generate document content with AI provider (with automatic fallback)
    let generatedText = ''
    try {
      generatedText = await generateWithAI({
        provider,
        systemPrompt,
        userPrompt,
        temperature: 0.2, // Lower temperature for consistent legal text
        maxTokens: 2000,
      })

      // Clean up generated text: remove placeholders, ensure signature blocks
      generatedText = cleanGeneratedDocument(generatedText, template, form_data)
    } catch (error: any) {
      console.error('AI generation error:', error)
      return NextResponse.json(
        { error: 'Failed to generate document content. Please try again.' },
        { status: 500 }
      )
    }

    // Create DOCX file
    const docBuffer = await createDocx(template.name, form_data, generatedText)

    // Upload DOCX to Supabase Storage
    const timestamp = Date.now()
    const docxFileName = `${timestamp}_${template_id}.docx`
    const docxFilePath = `${profile.organization_id}/${docxFileName}`

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(docxFilePath, docBuffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 })
    }

    // Create PDF file (with watermark for trial users)
    const watermark = shouldAddWatermark(tier) ? getWatermarkText(tier) : undefined
    const pdfBuffer = await generatePDF({
      title: template.name,
      content: generatedText,
      watermark,
      formData: form_data,
    })

    // Upload PDF to Supabase Storage
    const pdfFileName = `${timestamp}_${template_id}.pdf`
    const pdfFilePath = `${profile.organization_id}/${pdfFileName}`

    const { error: pdfUploadError } = await supabase.storage
      .from('documents')
      .upload(pdfFilePath, pdfBuffer, {
        contentType: 'application/pdf',
      })

    if (pdfUploadError) {
      console.error('PDF upload error:', pdfUploadError)
      // Continue even if PDF upload fails - user still has DOCX
    }

    // Get signed URLs (expire in 1 hour)
    const { data: docxUrlData } = await supabase.storage
      .from('documents')
      .createSignedUrl(docxFilePath, 3600)

    const { data: pdfUrlData } = pdfUploadError
      ? { data: null }
      : await supabase.storage.from('documents').createSignedUrl(pdfFilePath, 3600)

    // Save document record to database
    const { data: documentRecord, error: dbError } = await supabase
      .from('generated_documents')
      .insert({
        organization_id: profile.organization_id,
        user_id: user.id,
        template_id: template_id,
        title: `${template.name} - ${form_data.petitioner_name || 'Untitled'}`,
        form_data: form_data,
        file_url: docxFilePath,
        pdf_url: pdfUploadError ? null : pdfFilePath,
        file_size: docBuffer.length,
        status: 'generated'
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({ error: 'Failed to save document record' }, { status: 500 })
    }

    // Increment documents_used counter for the organization
    await supabase
      .from('organizations')
      .update({ documents_used: documentsUsed + 1 })
      .eq('id', profile.organization_id)

    return NextResponse.json({
      success: true,
      document_id: documentRecord.id,
      download_url: docxUrlData?.signedUrl,
      pdf_url: pdfUrlData?.signedUrl,
      document: documentRecord
    })

  } catch (error: any) {
    console.error('Document generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate document' },
      { status: 500 }
    )
  }
}

/**
 * Clean generated document to remove placeholders and ensure completeness
 */
function cleanGeneratedDocument(text: string, template: any, formData: any): string {
  let cleaned = text

  // Get current date in proper format
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  // Remove common placeholder patterns
  cleaned = cleaned.replace(/\[INSERT\s+MONTH\]/gi, currentDate.split(' ')[0]) // Extract month
  cleaned = cleaned.replace(/\[INSERT\s+DAY\]/gi, currentDate.split(' ')[1].replace(',', ''))
  cleaned = cleaned.replace(/\[INSERT\s+YEAR\]/gi, currentDate.split(' ')[2])
  cleaned = cleaned.replace(/\[INSERT\s+DATE\]/gi, currentDate)
  cleaned = cleaned.replace(/\[INSERT\s+[^\]]+\]/g, '_________________') // Replace any remaining placeholders with blank lines
  cleaned = cleaned.replace(/\[TO BE DETERMINED\]/gi, '_________________')
  cleaned = cleaned.replace(/\[TBD\]/gi, '_________________')

  // Ensure signature block is present at the end
  const hasSignature = /SIGNATURE|Signature|Respectfully submitted|_+\s*$/i.test(cleaned)

  if (!hasSignature) {
    // Add signature block based on template type
    const signatureName = formData.petitioner_name || formData.party1_name || formData.parent1_name || formData.paying_parent || formData.paying_spouse || 'Petitioner'

    cleaned += `\n\nDated: ${currentDate}\n\n`
    cleaned += `Respectfully submitted,\n\n`
    cleaned += `_________________________________\n`
    cleaned += `${signatureName}\n`

    if (template.id.includes('custody')) {
      cleaned += `Parent 1\n\n\n`
      cleaned += `_________________________________\n`
      cleaned += `${formData.parent2_name || 'Parent 2'}\n`
      cleaned += `Parent 2`
    } else {
      cleaned += `Petitioner, In Pro Per`
    }
  }

  return cleaned
}

function buildPrompt(template: any, formData: any): string {
  // Template-specific prompt building
  switch (template.id) {
    case 'divorce-petition-ca':
      return `You are an experienced California family law attorney with 15+ years of practice specializing in dissolution proceedings. You have successfully filed hundreds of FL-100 petitions in ${formData.county} County Superior Court.

TASK: Draft a complete, court-ready Petition for Dissolution of Marriage (California Judicial Council Form FL-100) that can be filed immediately without modification.

CASE INFORMATION:
══════════════════════════════════════
Petitioner Details:
- Full Legal Name: ${formData.petitioner_name}
${formData.petitioner_address ? `- Address: ${formData.petitioner_address}${formData.petitioner_city ? `, ${formData.petitioner_city}` : ''}${formData.petitioner_zip ? `, CA ${formData.petitioner_zip}` : ''}` : ''}
${formData.petitioner_phone ? `- Telephone: ${formData.petitioner_phone}` : ''}
${formData.petitioner_email ? `- Email: ${formData.petitioner_email}` : ''}
${formData.attorney_name ? `- Attorney: ${formData.attorney_name}${formData.attorney_bar_number ? ` (Bar No. ${formData.attorney_bar_number})` : ''}` : '- Appearing: In Pro Per'}

Respondent Details:
- Full Legal Name: ${formData.respondent_name}
${formData.respondent_address ? `- Address: ${formData.respondent_address}` : '- Address: (To be served)'}
${formData.respondent_phone ? `- Telephone: ${formData.respondent_phone}` : ''}

Marriage Information:
- Date of Marriage: ${formData.marriage_date}
${formData.marriage_location ? `- Place of Marriage: ${formData.marriage_location}` : ''}
- Date of Separation: ${formData.separation_date}
- Grounds: Irreconcilable differences (Cal. Fam. Code § 2310)

Jurisdiction:
- County for Filing: ${formData.county} County
- CA Residency: ${formData.ca_residency_duration || 'More than 6 months'}
- County Residency: ${formData.county_residency_duration || 'More than 3 months'}

Minor Children:
${formData.children ? `- Minor Children Exist: YES
${formData.children_count ? `- Number of Children: ${formData.children_count}` : ''}
${formData.children_details ? `- Children Details: ${formData.children_details}` : ''}
${formData.custody_preference ? `- Custody Request: ${formData.custody_preference}` : ''}` : '- Minor Children: NONE'}

Community Property & Debts:
${formData.property ? `- Community Property/Debts Exist: YES
${formData.property_details ? `- Details: ${formData.property_details}` : ''}` : '- Community Property/Debts: NONE or to be determined'}

Relief Requested:
${formData.request_custody ? '✓ Legal and physical custody orders for minor children\n' : ''}${formData.request_support ? '✓ Child support per California guideline (Fam. Code § 4055)\n' : ''}${formData.request_spousal_support ? '✓ Spousal support pursuant to Fam. Code § 4320\n' : ''}${formData.request_property ? '✓ Equal division of community property per Fam. Code § 2550\n' : ''}${formData.request_name_change ? `✓ Restore former name to: ${formData.former_name}\n` : ''}✓ Attorney fees and costs
✓ Such other and further relief as the Court deems just and proper

CRITICAL LEGAL REQUIREMENTS:
══════════════════════════════════════
1. **Jurisdictional Basis** (MANDATORY - Case will be dismissed without these):
   ✓ MUST state Petitioner has been a California resident for at least 6 months immediately preceding filing
   ✓ MUST state Petitioner has been a ${formData.county} County resident for at least 3 months immediately preceding filing
   ✓ Cite California Family Code § 2320 for jurisdictional requirements

2. **Grounds for Dissolution** (MANDATORY):
   ✓ State "irreconcilable differences" as ground (Cal. Fam. Code § 2310)
   ✓ State marriage is "irretrievably broken"
   ✓ DO NOT include fault-based allegations or inflammatory language

3. **UCCJEA Compliance** (MANDATORY if children):
   ${formData.children ? `✓ State California is the "home state" for UCCJEA purposes
   ✓ State no other state has jurisdiction over custody
   ✓ Cite Uniform Child Custody Jurisdiction and Enforcement Act (Fam. Code § 3400 et seq.)
   ✓ Request Court exercise jurisdiction over custody and visitation` : '✓ N/A - No minor children'}

4. **Community Property Declaration**:
   ${formData.property ? '✓ State community property and/or debts exist requiring division\n   ✓ Request equal division pursuant to Fam. Code §§ 2550-2551' : '✓ State no community property or debts, OR property/debts to be determined'}

EXACT FORMAT REQUIREMENTS:
══════════════════════════════════════
Header Block:

SUPERIOR COURT OF CALIFORNIA
COUNTY OF ${formData.county.toUpperCase()}

In re the Marriage of                    Case No.: ________________

${formData.petitioner_name.toUpperCase()},          PETITION FOR DISSOLUTION OF
                                                     MARRIAGE (FAMILY LAW)
              Petitioner,
and                                                  (Family Code §§ 2320, 2330)

${formData.respondent_name.toUpperCase()},

              Respondent.

Document Structure (use THIS EXACT format):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
I. PETITIONER'S INFORMATION
   [Petitioner contact details and representation status]

II. RESPONDENT'S INFORMATION
   [Respondent contact details]

III. JURISDICTIONAL BASIS
   [Mandatory residency statements with code citations]

IV. MARRIAGE AND SEPARATION
   [Marriage date, separation date, grounds]

V. MINOR CHILDREN ${formData.children ? '' : '(N/A)'}
   [UCCJEA declarations if children exist]

VI. COMMUNITY PROPERTY AND DEBTS ${formData.property ? '' : '(N/A or TBD)'}
   [Statement of property/debts requiring division]

VII. RELIEF REQUESTED
   WHEREFORE, Petitioner respectfully requests this Court:
   [Numbered list of specific prayers for relief]

VIII. DECLARATION UNDER PENALTY OF PERJURY
   [Standard California declaration language]

IX. SIGNATURE BLOCK
   Dated: [Date]

   ________________________________
   ${formData.petitioner_name}
   ${formData.attorney_name ? 'Petitioner' : 'Petitioner, In Pro Per'}

WRITING STYLE REQUIREMENTS:
══════════════════════════════════════
✓ Use FORMAL legal language (respectfully requests, is informed and believes, etc.)
✓ Write in THIRD PERSON (not "I" or "my")
✓ Be ASSERTIVE but NOT antagonistic or inflammatory
✓ Use ACTIVE voice where possible
✓ Include SPECIFIC code citations (e.g., "California Family Code § 2320")
✓ Use proper legal terms (dissolution not divorce, minor children not kids)
✓ Number paragraphs for easy reference (1, 2, 3, etc.)
✓ Keep sentences clear and unambiguous

TONE EXAMPLES:
✓ CORRECT: "Petitioner respectfully requests this Court grant a dissolution of marriage."
✗ WRONG: "I want a divorce from my husband."

✓ CORRECT: "The parties' marriage is irretrievably broken due to irreconcilable differences."
✗ WRONG: "We can't get along anymore and fight all the time."

✓ CORRECT: "Petitioner has been a resident of the State of California for more than six (6) months immediately preceding the filing of this Petition."
✗ WRONG: "I've lived in California for over 6 months."

OUTPUT INSTRUCTIONS:
══════════════════════════════════════
Generate ONLY the petition document text, ready to file with the court.

DO NOT INCLUDE:
✗ Explanatory notes or instructions
✗ Bracketed placeholders
✗ "This is a draft" disclaimers
✗ Legal advice or recommendations
✗ Formatting instructions

START with the case caption header.
END with the signature block.

Generate the complete, court-ready FL-100 petition now:`

    case 'custody-agreement-ca':
      return `You are an experienced California family law attorney with 15+ years specializing in child custody matters and parenting plans. You have drafted hundreds of custody agreements in ${formData.county} County that serve the best interests of children while protecting parents' rights.

TASK: Draft a complete, court-ready Child Custody and Visitation Agreement that can be filed with California Superior Court or used as a stipulation between parties.

CASE INFORMATION:
══════════════════════════════════════
Parent/Party Information:
- Parent 1 (Petitioner): ${formData.parent1_name}
${formData.parent1_address ? `- Address: ${formData.parent1_address}` : ''}
${formData.parent1_phone ? `- Phone: ${formData.parent1_phone}` : ''}

- Parent 2 (Respondent): ${formData.parent2_name}
${formData.parent2_address ? `- Address: ${formData.parent2_address}` : ''}
${formData.parent2_phone ? `- Phone: ${formData.parent2_phone}` : ''}

Jurisdiction:
- County: ${formData.county} County Superior Court
- State: California

Children Information:
${formData.children_info || 'Children subject to this agreement (names, DOB, ages)'}
${formData.children_count ? `- Number of Minor Children: ${formData.children_count}` : ''}

Custody Arrangement:
- Legal Custody: ${formData.legal_custody || 'Joint Legal Custody'}
- Physical Custody: ${formData.physical_custody || 'Joint Physical Custody'}
- Primary Residence: ${formData.primary_residence || 'To be specified'}
${formData.custody_type ? `- Overall Type: ${formData.custody_type}` : ''}

Visitation/Parenting Time Schedule:
${formData.regular_schedule ? `Regular Schedule: ${formData.regular_schedule}` : 'Schedule to be specified in detail'}
${formData.holiday_schedule ? `Holidays: ${formData.holiday_schedule}` : ''}
${formData.summer_schedule ? `Summer: ${formData.summer_schedule}` : ''}
${formData.exchange_location ? `Exchange Location: ${formData.exchange_location}` : ''}

Special Provisions:
${formData.relocation_restriction ? `✓ Relocation restrictions apply` : ''}
${formData.right_of_first_refusal ? `✓ Right of first refusal requested` : ''}
${formData.communication_method ? `- Child communication: ${formData.communication_method}` : ''}

CRITICAL LEGAL REQUIREMENTS:
══════════════════════════════════════
1. **Best Interests of the Child Standard** (MANDATORY):
   ✓ MUST emphasize all provisions serve the best interests of the minor children
   ✓ Reference California Family Code § 3011 (best interests factors)
   ✓ Consider child's health, safety, and welfare as paramount concern

2. **Legal Custody Provisions** (Decision-Making Authority):
   ✓ Define whether Joint Legal Custody or Sole Legal Custody
   ✓ Joint = Both parents share decision-making for education, healthcare, religion, extracurriculars
   ✓ Specify consultation and notification requirements
   ✓ Include tie-breaker provisions if parents disagree
   ✓ Cite Family Code § 3003 (joint legal custody definition)

3. **Physical Custody Provisions** (Where Child Resides):
   ✓ Define whether Joint Physical Custody or Primary Physical Custody
   ✓ Specify each parent's parenting time percentage if possible
   ✓ Detail primary residence and school district
   ✓ Include provisions for maintaining stability

4. **Detailed Parenting Schedule** (MANDATORY - Be Specific):
   ✓ Regular Weekly Schedule (which days, pick-up/drop-off times)
   ✓ Holiday Schedule (specify each major holiday: Thanksgiving, Christmas, New Year's, Easter, July 4th, Labor Day, Memorial Day, Mother's Day, Father's Day, children's birthdays, parents' birthdays)
   ✓ Summer Vacation Schedule (how many weeks, notification requirements)
   ✓ School Breaks (Spring Break, Winter Break)
   ✓ Include even-year/odd-year alternations

5. **UCCJEA Compliance** (Jurisdictional):
   ✓ State California is the "home state" under UCCJEA
   ✓ State no other proceeding concerning custody exists in another state
   ✓ Cite Uniform Child Custody Jurisdiction and Enforcement Act (Fam. Code § 3400 et seq.)

6. **Communication & Access**:
   ✓ Child's right to frequent and continuing contact with both parents (FC § 3020)
   ✓ Specify phone/video call rights during other parent's time
   ✓ Include reasonable electronic communication provisions

7. **Exchange Provisions**:
   ✓ Specify exact exchange times and locations
   ✓ Include transportation responsibilities
   ✓ Address curbside vs. door-to-door exchanges

8. **Relocation Restrictions**:
   ✓ Include move-away notice requirements (60 days written notice per FC § 7501)
   ✓ Define restricted geographic area if applicable
   ✓ Specify court approval requirements for moves

EXACT FORMAT REQUIREMENTS:
══════════════════════════════════════
Header Block:
\`\`\`
SUPERIOR COURT OF CALIFORNIA
COUNTY OF ${formData.county.toUpperCase()}

In re the Marriage/Parentage of          Case No.: ________________

${formData.parent1_name.toUpperCase()},
                                         CHILD CUSTODY AND VISITATION
              Petitioner/Parent 1,       AGREEMENT (STIPULATION)
and
                                         (Family Code §§ 3011, 3020, 3080)
${formData.parent2_name.toUpperCase()},

              Respondent/Parent 2.
\`\`\`

Document Structure (use THIS EXACT format):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
I. PARTIES AND JURISDICTION
   [Parent information and UCCJEA declarations]

II. CHILDREN SUBJECT TO THIS AGREEMENT
   [Names, DOB, ages of all minor children]

III. LEGAL CUSTODY
   [Joint or sole, decision-making framework, consultation requirements]

IV. PHYSICAL CUSTODY AND PRIMARY RESIDENCE
   [Joint or primary, where children primarily reside, school district]

V. PARENTING TIME SCHEDULE
   A. Regular Weekly Schedule
   B. Holiday Schedule
   C. Summer Vacation
   D. School Breaks

VI. EXCHANGE PROVISIONS
   [Times, locations, transportation responsibilities]

VII. COMMUNICATION AND ACCESS
   [Phone/video calls, electronic communication, reasonable access]

VIII. RELOCATION RESTRICTIONS
   [Move-away notice, geographic restrictions, court approval requirements]

IX. ADDITIONAL PROVISIONS
   [Right of first refusal, extracurricular activities, travel, etc.]

X. MODIFICATION
   [How agreement can be modified]

XI. GENERAL PROVISIONS
   [Best interests standard, mutual respect, dispute resolution]

XII. DECLARATION AND SIGNATURES
   [Both parents sign under penalty of perjury]

WRITING STYLE REQUIREMENTS:
══════════════════════════════════════
✓ Use FORMAL but CHILD-FOCUSED language
✓ Write in THIRD PERSON or use "The parties agree..."
✓ Be SPECIFIC and DETAILED (avoid vague terms like "reasonable" alone)
✓ Use COOPERATIVE tone (this is an agreement, not adversarial)
✓ Include SPECIFIC times (not "evening" but "6:00 PM")
✓ Include SPECIFIC dates and holidays
✓ Use proper legal terms (parenting time not visitation, legal custody not decision-making)
✓ Number paragraphs and sub-paragraphs clearly (1, 2, 3, then a, b, c)

TONE EXAMPLES:
✓ CORRECT: "The parties agree to Joint Legal Custody, meaning both parents shall jointly make major decisions regarding the children's health, education, and welfare after good faith consultation with each other."
✗ WRONG: "Both parents get to decide things together."

✓ CORRECT: "Parent 1 shall have parenting time every Monday and Tuesday from 3:00 PM until Wednesday at 8:00 AM, at which time the children shall be returned to Parent 2's residence."
✗ WRONG: "Mom gets the kids a couple days a week."

✓ CORRECT: "The children shall spend Thanksgiving holiday in even-numbered years with Parent 1 from Wednesday at 6:00 PM until Sunday at 6:00 PM, and in odd-numbered years with Parent 2 during the same time period."
✗ WRONG: "Parents will alternate Thanksgiving."

SCHEDULE SPECIFICITY EXAMPLES:
✓ CORRECT: "Parent 2 shall have parenting time on alternating weekends from Friday at 6:00 PM until Sunday at 6:00 PM. Exchanges shall occur at the Target parking lot located at [address]."
✗ WRONG: "Dad gets every other weekend."

✓ CORRECT: "Each parent shall be entitled to two (2) non-consecutive weeks of vacation time with the children during summer break, with at least thirty (30) days' advance written notice to the other parent."
✗ WRONG: "Each parent gets some summer time."

OUTPUT INSTRUCTIONS:
══════════════════════════════════════
Generate ONLY the custody agreement document text, ready to file or submit to court.

DO NOT INCLUDE:
✗ Explanatory notes or commentary
✗ Bracketed placeholders like [INSERT DATE]
✗ Instructions to the reader
✗ Legal advice
✗ "This is a template" disclaimers

DO INCLUDE:
✓ Specific days, times, and locations
✓ Complete holiday schedule
✓ All standard provisions for a comprehensive custody agreement
✓ Professional legal language throughout

START with the case caption header.
END with the signature blocks for both parents.

Generate the complete, court-ready custody and visitation agreement now:`

    case 'property-settlement-ca':
      return `You are an experienced California family law attorney with 15+ years specializing in marital property division and asset settlements. You have successfully negotiated and drafted hundreds of property settlement agreements in ${formData.county} County that achieve equal division while maintaining fairness and clarity.

TASK: Draft a complete, court-ready Property Settlement Agreement (Marital Settlement Agreement - MSA) that provides for the division of all community property and debts in accordance with California law.

CASE INFORMATION:
══════════════════════════════════════
Party Information:
- Party 1 (Petitioner): ${formData.party1_name}
${formData.party1_address ? `- Address: ${formData.party1_address}` : ''}

- Party 2 (Respondent): ${formData.party2_name}
${formData.party2_address ? `- Address: ${formData.party2_address}` : ''}

Jurisdiction:
- County: ${formData.county} County Superior Court
- State: California

Marriage Details:
${formData.marriage_date ? `- Date of Marriage: ${formData.marriage_date}` : ''}
${formData.separation_date ? `- Date of Separation: ${formData.separation_date}` : ''}

PROPERTY AND ASSETS TO BE DIVIDED:
──────────────────────────────────────
Real Property:
${formData.real_property || 'Real property to be specified (homes, land, rental properties)'}
${formData.family_home ? `- Family Residence: ${formData.family_home}` : ''}
${formData.family_home_value ? `- Estimated Value: $${formData.family_home_value}` : ''}
${formData.family_home_equity ? `- Equity: $${formData.family_home_equity}` : ''}

Personal Property:
${formData.personal_property || 'Personal property to be specified (vehicles, furniture, electronics, jewelry)'}
${formData.vehicles ? `- Vehicles: ${formData.vehicles}` : ''}

Financial Accounts:
${formData.bank_accounts || 'Bank accounts, savings, checking, money market accounts'}
${formData.investment_accounts || 'Investment accounts, stocks, bonds, brokerage accounts'}

Retirement Accounts:
${formData.retirement_accounts || 'Retirement accounts (401k, IRA, pension, 403b)'}
${formData.qdro_required ? '✓ QDRO will be required for retirement division' : ''}

Business Interests:
${formData.business_interests || 'Business ownership interests, partnerships, LLC interests'}

Other Assets:
${formData.other_assets || 'Tax refunds, life insurance, intellectual property, other assets'}

DEBTS AND LIABILITIES:
──────────────────────────────────────
Community Debts:
${formData.debts || 'Community debts to be specified (mortgages, credit cards, loans, medical bills)'}
${formData.mortgage_balance ? `- Mortgage Balance: $${formData.mortgage_balance}` : ''}
${formData.credit_card_debt ? `- Credit Card Debt: $${formData.credit_card_debt}` : ''}
${formData.auto_loans ? `- Auto Loans: $${formData.auto_loans}` : ''}
${formData.other_debts ? `- Other Debts: ${formData.other_debts}` : ''}

Division Agreement:
${formData.division_method || 'Equal (50/50) division of community property and debts'}
${formData.buyout_amount ? `- Buyout Amount: $${formData.buyout_amount}` : ''}

Spousal Support:
${formData.spousal_support_waiver ? '✓ Both parties waive spousal support' : formData.spousal_support_terms || 'Spousal support to be addressed'}

CRITICAL LEGAL REQUIREMENTS:
══════════════════════════════════════
1. **Community Property Presumption** (MANDATORY):
   ✓ MUST state California is a community property state
   ✓ All property acquired during marriage is presumed community property (FC § 760)
   ✓ Equal division presumption - 50/50 split (FC § 2550)
   ✓ Cite California Family Code § 2550 (equal division) and § 2551 (valuation date)

2. **Characterization of Property**:
   ✓ Clearly identify each asset as community property or separate property
   ✓ Separate property = owned before marriage, gifts, inheritance (FC § 770)
   ✓ Include date of separation as relevant valuation date
   ✓ Address any transmutation claims if separate property became community

3. **Comprehensive Asset Division** (MANDATORY Sections):
   ✓ Real Property (address, legal description, value, who receives, buyout terms)
   ✓ Personal Property (vehicles with VIN, furniture, electronics, jewelry)
   ✓ Financial Accounts (institution name, account numbers [last 4 digits], balances, division)
   ✓ Retirement Accounts (type, institution, approximate value, QDRO requirements per FC § 2610)
   ✓ Business Interests (name, ownership percentage, valuation, who retains)
   ✓ Tax Issues (refunds, liabilities, who claims children as dependents)

4. **Debt Allocation** (MANDATORY):
   ✓ List each debt specifically (creditor, account, balance, who pays)
   ✓ Include hold harmless and indemnification language
   ✓ Address mortgage responsibility if family home awarded
   ✓ Specify debt payment deadlines and refinance obligations

5. **QDRO Requirements** (if retirement accounts divided):
   ✓ State Qualified Domestic Relations Order will be prepared and filed
   ✓ Specify percentage or dollar amount of division
   ✓ Reference Federal law (ERISA) and California Family Code § 2610
   ✓ Include timeline for QDRO preparation and filing

6. **Disclosure and Waiver** (MANDATORY):
   ✓ State both parties have fully disclosed all assets and debts
   ✓ Reference completed Preliminary Declarations of Disclosure (FL-140/FL-142)
   ✓ Include waiver of Final Declaration of Disclosure if applicable (FC § 2105)
   ✓ State agreement is fair, just, and reasonable

7. **Mutual Releases**:
   ✓ Each party releases claims to property awarded to the other
   ✓ Include waiver of spousal support if applicable (cannot be modified later)
   ✓ General release of claims language

8. **Legal Effect**:
   ✓ State agreement is binding and enforceable
   ✓ Reference incorporation into judgment (FC § 2122)
   ✓ State agreement survives judgment

EXACT FORMAT REQUIREMENTS:
══════════════════════════════════════
Header Block:
\`\`\`
SUPERIOR COURT OF CALIFORNIA
COUNTY OF ${formData.county.toUpperCase()}

In re the Marriage of                    Case No.: ________________

${formData.party1_name.toUpperCase()},          PROPERTY SETTLEMENT AGREEMENT
                                                 (MARITAL SETTLEMENT AGREEMENT)
              Petitioner,
and                                              (Family Code §§ 2550, 2551, 2610)

${formData.party2_name.toUpperCase()},

              Respondent.
\`\`\`

Document Structure (use THIS EXACT format):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
I. PARTIES AND RECITALS
   [Party information, marriage date, separation date, intent to settle]

II. GENERAL PROVISIONS
   [Community property law, disclosure statements, fair agreement]

III. REAL PROPERTY
   [Each property with address, value, who receives, buyout terms, transfer deadlines]

IV. PERSONAL PROPERTY
   [Vehicles, furniture, electronics, jewelry - specific items and allocation]

V. FINANCIAL ACCOUNTS
   [Banks, savings, checking, money market - institution, balance, division]

VI. INVESTMENT ACCOUNTS
   [Brokerage, stocks, bonds - specific allocation]

VII. RETIREMENT ACCOUNTS AND QDRO
   [401k, IRA, pension - division terms and QDRO requirements]

VIII. BUSINESS INTERESTS
   [Business names, ownership, valuation, who retains]

IX. OTHER ASSETS
   [Tax refunds, life insurance, other assets not previously listed]

X. DEBTS AND OBLIGATIONS
   [Each debt with creditor, balance, responsible party, hold harmless language]

XI. TAX ISSUES
   [Returns, liabilities, dependency exemptions]

XII. SPOUSAL SUPPORT
   [Waiver or terms of support]

XIII. ATTORNEYS' FEES AND COSTS
   [Each party bears own fees, or allocation]

XIV. MUTUAL RELEASES
   [Release of claims to property, general release]

XV. GENERAL PROVISIONS
   [Binding effect, modification, governing law, entire agreement]

XVI. DECLARATIONS AND SIGNATURES
   [Both parties sign under penalty of perjury]

WRITING STYLE REQUIREMENTS:
══════════════════════════════════════
✓ Use FORMAL, PRECISE legal language
✓ Be EXTREMELY SPECIFIC about every asset and debt
✓ Use exact dollar amounts, account numbers (last 4 digits), addresses
✓ Write in THIRD PERSON or "The parties agree..."
✓ Be CLEAR about who gets what (use full names consistently)
✓ Include DEADLINES for transfers and refinancing
✓ Use proper legal terms (community property, separate property, equal division)
✓ Number paragraphs clearly (1, 2, 3, with subparagraphs a, b, c)

TONE EXAMPLES:
✓ CORRECT: "Petitioner shall be awarded as her sole and separate property the 2020 Honda Accord, VIN XXXXX, with an approximate value of $25,000. Petitioner shall assume and hold Respondent harmless from the auto loan with Chase Bank, account ending in 4567, current balance approximately $18,000."
✗ WRONG: "Wife gets the Honda and pays the loan."

✓ CORRECT: "The parties agree that the family residence located at 123 Main Street, Los Angeles, CA 90001, shall be awarded to Respondent as his sole and separate property. Respondent shall refinance the existing mortgage and remove Petitioner's name from all loan documents within ninety (90) days of entry of judgment."
✗ WRONG: "Husband gets the house and needs to refinance."

✓ CORRECT: "The parties' community property shall be divided equally pursuant to California Family Code Section 2550. The parties acknowledge they have been married for seven (7) years, from June 15, 2016 to the date of separation, January 10, 2024."
✗ WRONG: "We'll split everything 50/50."

SPECIFICITY EXAMPLES:
✓ CORRECT: "Petitioner's Wells Fargo 401(k) account, approximate value $85,000, shall be divided by Qualified Domestic Relations Order (QDRO) with fifty percent (50%) of the community interest awarded to Respondent. The parties agree to cooperate in the preparation and submission of the QDRO within sixty (60) days."
✗ WRONG: "We'll split the 401k."

OUTPUT INSTRUCTIONS:
══════════════════════════════════════
Generate ONLY the property settlement agreement document text, ready to file or submit to court.

DO NOT INCLUDE:
✗ Explanatory notes or instructions
✗ Bracketed placeholders like [INSERT AMOUNT] - use actual amounts from formData
✗ Legal advice or recommendations
✗ "This is a sample" disclaimers
✗ Instructions to parties

DO INCLUDE:
✓ Specific values, account numbers (last 4), addresses
✓ Exact division of every asset and debt
✓ All required legal citations
✓ Hold harmless and indemnification language for debts
✓ Professional legal language throughout

START with the case caption header.
END with the signature blocks for both parties.

Generate the complete, court-ready property settlement agreement now:`

    case 'child-support-ca':
      return `You are an experienced California family law attorney with 15+ years specializing in child support matters and guideline calculations. You have prepared hundreds of child support orders in ${formData.county} County that comply with California's mandatory guideline formula.

TASK: Draft a complete, court-ready Child Support Order that establishes guideline child support pursuant to California Family Code § 4055 and related provisions.

CASE INFORMATION:
══════════════════════════════════════
Party Information:
- Paying Parent (Obligor): ${formData.paying_parent}
${formData.paying_parent_address ? `- Address: ${formData.paying_parent_address}` : ''}

- Receiving Parent (Obligee): ${formData.receiving_parent}
${formData.receiving_parent_address ? `- Address: ${formData.receiving_parent_address}` : ''}

Jurisdiction:
- County: ${formData.county} County Superior Court
- State: California

Children Subject to Support:
${formData.children_info || 'Children for whom support is ordered (names, DOB, ages)'}
- Number of Minor Children: ${formData.number_of_children || 'To be specified'}

INCOME AND FINANCIAL INFORMATION:
──────────────────────────────────────
Paying Parent (Obligor) Income:
- Gross Monthly Income: ${formData.paying_parent_income ? `$${formData.paying_parent_income}` : 'To be determined'}
${formData.paying_parent_income_source ? `- Income Source: ${formData.paying_parent_income_source}` : ''}
${formData.paying_parent_deductions ? `- Allowable Deductions: ${formData.paying_parent_deductions}` : ''}
${formData.paying_parent_tax_filing ? `- Tax Filing Status: ${formData.paying_parent_tax_filing}` : ''}

Receiving Parent (Obligee) Income:
- Gross Monthly Income: ${formData.receiving_parent_income ? `$${formData.receiving_parent_income}` : 'To be determined'}
${formData.receiving_parent_income_source ? `- Income Source: ${formData.receiving_parent_income_source}` : ''}
${formData.receiving_parent_deductions ? `- Allowable Deductions: ${formData.receiving_parent_deductions}` : ''}

Timeshare (Custody Percentage):
- Paying Parent's Time: ${formData.paying_parent_timeshare || 'To be specified (percentage of time children spend with paying parent)'}
- Receiving Parent's Time: ${formData.receiving_parent_timeshare || 'To be specified'}
${formData.timeshare ? `- Overall Arrangement: ${formData.timeshare}` : ''}

ADD-ON EXPENSES:
──────────────────────────────────────
Mandatory Add-Ons:
${formData.childcare_costs ? `- Childcare Costs: $${formData.childcare_costs}/month` : '- Childcare: To be addressed if applicable'}
${formData.health_insurance_premium ? `- Health Insurance Premium (children only): $${formData.health_insurance_premium}/month` : '- Health Insurance: To be addressed'}
${formData.uninsured_medical ? `- Uninsured Medical/Dental Expenses: ${formData.uninsured_medical}` : '- Uninsured Medical: Typically split per percentage of incomes'}

Other Expenses:
${formData.educational_expenses ? `- Educational Expenses: ${formData.educational_expenses}` : ''}
${formData.travel_costs ? `- Travel Costs for Visitation: ${formData.travel_costs}` : ''}

Support Calculation:
${formData.guideline_support_amount ? `- Guideline Support Amount: $${formData.guideline_support_amount}/month` : '- Amount to be calculated per FC § 4055 formula'}
${formData.support_calculator_used ? `- Calculated using: ${formData.support_calculator_used}` : ''}

Payment Details:
${formData.payment_method ? `- Payment Method: ${formData.payment_method}` : '- Payment Method: To be specified (direct, wage assignment, DCSS)'}
${formData.payment_date ? `- Payment Due: ${formData.payment_date}` : '- Due: First day of each month'}

CRITICAL LEGAL REQUIREMENTS:
══════════════════════════════════════
1. **Mandatory Guideline Formula** (ABSOLUTELY MANDATORY):
   ✓ MUST use California Family Code § 4055 statewide uniform guideline formula
   ✓ Formula: CS = K[HN - (H%)(TN)]
     where:
     • CS = child support amount
     • K = amount of both parents' income allocated for child support
     • HN = high earner's net monthly disposable income
     • H% = high earner's approximate percentage of time with children
     • TN = total net monthly disposable income of both parties
   ✓ State that guideline support is presumptively correct
   ✓ Any deviation from guideline MUST be justified per FC § 4057

2. **Income Determination** (MANDATORY):
   ✓ Define "gross income" per FC § 4058 (includes wages, salary, commissions, bonuses, rents, etc.)
   ✓ Specify allowable deductions per FC § 4059 (state/federal taxes, mandatory retirement, health insurance)
   ✓ Calculate "net disposable income" for both parents
   ✓ Address imputed income if parent is unemployed/underemployed (FC § 4058)

3. **Timeshare Calculation** (MANDATORY):
   ✓ Calculate each parent's percentage of time with children
   ✓ Based on custody/visitation schedule (include overnight visits)
   ✓ High timeshare (>50%) vs. low timeshare considerations
   ✓ Affects support calculation significantly

4. **Mandatory Add-On Expenses** (FC § 4062):
   ✓ Childcare costs related to employment/training (divide per income percentage)
   ✓ Children's health insurance premiums (divide per income percentage)
   ✓ Uninsured medical/dental expenses (typically 50/50 or per income percentage)
   ✓ Educational expenses if agreed or ordered

5. **Duration of Support** (MANDATORY):
   ✓ Support continues until child turns 18 AND graduates high school (whichever occurs later)
   ✓ Maximum age 19 if still full-time high school student (FC § 3901)
   ✓ Support terminates on emancipation events: marriage, military, self-supporting, death
   ✓ Specify termination provisions for each child individually

6. **Payment Provisions** (MANDATORY):
   ✓ Specify exact monthly amount
   ✓ Payment due date (typically 1st of month)
   ✓ Payment method: Income Withholding Order (wage assignment), direct payment, or through DCSS
   ✓ Reference Income Withholding Order (Form FL-195) per FC § 5230
   ✓ Include interest on arrears at 10% per annum (FC § 4052)

7. **Modification** (Required Statement):
   ✓ Support subject to modification upon change in circumstances
   ✓ Either party may request modification (FC § 3651)
   ✓ Support amount may be reviewed every 3 years or upon significant change

8. **Hardship Deduction** (if applicable per FC § 4071):
   ✓ Address if paying parent has children from another relationship
   ✓ Hardship calculation reduces net disposable income

EXACT FORMAT REQUIREMENTS:
══════════════════════════════════════
Header Block:
\`\`\`
SUPERIOR COURT OF CALIFORNIA
COUNTY OF ${formData.county.toUpperCase()}

In re the Marriage/Parentage of          Case No.: ________________

${formData.paying_parent ? formData.paying_parent.toUpperCase() : 'PETITIONER'},
                                         CHILD SUPPORT ORDER
              Petitioner/Obligor,        (STIPULATION OR ORDER AFTER HEARING)
and
                                         (Family Code §§ 4050-4076)
${formData.receiving_parent ? formData.receiving_parent.toUpperCase() : 'RESPONDENT'},

              Respondent/Obligee.
\`\`\`

Document Structure (use THIS EXACT format):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
I. PARTIES AND JURISDICTION
   [Party information, county, case background]

II. CHILDREN SUBJECT TO SUPPORT
   [Names, DOB, ages of all minor children for whom support is ordered]

III. INCOME FINDINGS
   A. Obligor's Income
      [Gross monthly income, allowable deductions, net disposable income]
   B. Obligee's Income
      [Gross monthly income, allowable deductions, net disposable income]

IV. TIMESHARE CALCULATION
   [Percentage of time children spend with each parent]

V. GUIDELINE CHILD SUPPORT CALCULATION
   [Application of FC § 4055 formula, calculation details, presumptive amount]

VI. MANDATORY ADD-ON EXPENSES
   [Childcare, health insurance, uninsured medical - amounts and allocation]

VII. TOTAL CHILD SUPPORT ORDER
   [Base support + add-ons = total monthly payment]

VIII. PAYMENT TERMS
   [Amount, due date, payment method, Income Withholding Order]

IX. DURATION AND TERMINATION
   [When support ends for each child, emancipation events]

X. HEALTH INSURANCE AND MEDICAL EXPENSES
   [Who maintains insurance, uninsured expense allocation]

XI. MODIFICATION PROVISIONS
   [Right to modify, change in circumstances, 3-year review]

XII. ARREARS AND INTEREST
   [Interest on late payments, consequences of non-payment]

XIII. INCOME AND EXPENSE DECLARATION
   [Reference to FL-150 forms filed by both parties]

XIV. FINDINGS AND ORDER
   [Court findings, best interests, guideline support ordered]

XV. SIGNATURE BLOCKS
   [Judge signature or both parties if stipulation]

WRITING STYLE REQUIREMENTS:
══════════════════════════════════════
✓ Use FORMAL, PRECISE legal language with exact dollar amounts
✓ Be EXTREMELY SPECIFIC about income, deductions, and calculations
✓ Use THIRD PERSON or "The Court finds..." or "The parties stipulate..."
✓ Reference SPECIFIC Family Code sections (§ 4055, § 4058, § 4062, etc.)
✓ Include EXACT amounts and percentages
✓ Be CLEAR about payment terms and deadlines
✓ Use proper legal terms (obligor/obligee, guideline support, net disposable income)
✓ Number paragraphs clearly (1, 2, 3, with subparagraphs a, b, c)

TONE EXAMPLES:
✓ CORRECT: "Pursuant to California Family Code Section 4055, the Court finds that guideline child support is $1,285 per month. This amount is based on Obligor's net monthly disposable income of $5,200 and Obligee's net monthly disposable income of $3,800, with a timeshare of 20% to Obligor and 80% to Obligee."
✗ WRONG: "Dad should pay mom about $1,200 a month for the kids."

✓ CORRECT: "Obligor shall pay child support in the amount of $1,285 per month, payable on the first day of each month, through an Income Withholding Order pursuant to Family Code Section 5230. Said support shall be paid through the California State Disbursement Unit."
✗ WRONG: "He'll pay $1,285 monthly starting next month."

✓ CORRECT: "The parties shall equally divide all uninsured medical, dental, and orthodontic expenses for the minor children. Each party shall provide receipts and proof of payment to the other party within thirty (30) days of incurring such expenses."
✗ WRONG: "Split medical bills 50/50."

CALCULATION SPECIFICITY EXAMPLES:
✓ CORRECT: "The Court finds Obligor's gross monthly income to be $6,500, consisting of $6,000 in wages and $500 in rental income. After allowable deductions of $1,300 for taxes, FICA, and mandatory retirement contributions, Obligor's net monthly disposable income is $5,200."
✗ WRONG: "Dad makes about $6,500 gross, so around $5,200 net."

OUTPUT INSTRUCTIONS:
══════════════════════════════════════
Generate ONLY the child support order document text, ready to file or submit to court.

DO NOT INCLUDE:
✗ Explanatory notes or instructions
✗ Bracketed placeholders
✗ Actual mathematical calculations if income data is missing - state "to be determined"
✗ Legal advice
✗ "This is a draft" disclaimers

DO INCLUDE:
✓ Specific income amounts and calculations using provided data
✓ All required Family Code citations
✓ Complete payment terms and enforcement provisions
✓ Duration and termination language
✓ Professional legal language throughout

START with the case caption header.
END with the signature block.

Generate the complete, court-ready child support order now:`

    case 'spousal-support-ca':
      return `You are an experienced California family law attorney with 15+ years specializing in spousal support (alimony) matters. You have successfully drafted hundreds of spousal support orders in ${formData.county} County that balance the needs of receiving spouses with the paying capacity of supporting spouses while applying all Family Code § 4320 factors.

TASK: Draft a complete, court-ready Spousal Support Order (or Spousal Support Stipulation) that establishes support amount and duration in accordance with California Family Code § 4320 and related provisions.

CASE INFORMATION:
══════════════════════════════════════
Party Information:
- Paying Spouse (Payor/Obligor): ${formData.paying_spouse}
${formData.paying_spouse_address ? `- Address: ${formData.paying_spouse_address}` : ''}

- Receiving Spouse (Payee/Obligee): ${formData.receiving_spouse}
${formData.receiving_spouse_address ? `- Address: ${formData.receiving_spouse_address}` : ''}

Jurisdiction:
- County: ${formData.county} County Superior Court
- State: California

Marriage Information:
- Date of Marriage: ${formData.marriage_date || 'To be specified'}
- Date of Separation: ${formData.separation_date || 'To be specified'}
- Length of Marriage: ${formData.marriage_length || 'To be calculated'}
${formData.long_term_marriage ? '✓ Long-term marriage (10+ years) - Court retains jurisdiction indefinitely' : formData.short_term_marriage ? '✓ Short-term marriage (under 10 years) - Support typically ends at 1/2 marriage length' : ''}

INCOME AND FINANCIAL INFORMATION:
──────────────────────────────────────
Paying Spouse Income and Ability to Pay:
- Gross Monthly Income: ${formData.paying_spouse_income ? `$${formData.paying_spouse_income}` : 'To be determined'}
${formData.paying_spouse_income_source ? `- Income Source: ${formData.paying_spouse_income_source}` : ''}
${formData.paying_spouse_assets ? `- Assets: ${formData.paying_spouse_assets}` : ''}
${formData.paying_spouse_age ? `- Age: ${formData.paying_spouse_age}` : ''}
${formData.paying_spouse_health ? `- Health: ${formData.paying_spouse_health}` : ''}
${formData.paying_spouse_education ? `- Education: ${formData.paying_spouse_education}` : ''}
${formData.paying_spouse_earning_capacity ? `- Earning Capacity: ${formData.paying_spouse_earning_capacity}` : ''}

Receiving Spouse Needs:
- Gross Monthly Income: ${formData.receiving_spouse_income ? `$${formData.receiving_spouse_income}` : 'To be determined'}
${formData.receiving_spouse_income_source ? `- Income Source: ${formData.receiving_spouse_income_source}` : ''}
${formData.receiving_spouse_needs ? `- Monthly Needs/Expenses: ${formData.receiving_spouse_needs}` : ''}
${formData.receiving_spouse_assets ? `- Assets: ${formData.receiving_spouse_assets}` : ''}
${formData.receiving_spouse_age ? `- Age: ${formData.receiving_spouse_age}` : ''}
${formData.receiving_spouse_health ? `- Health: ${formData.receiving_spouse_health}` : ''}
${formData.receiving_spouse_education ? `- Education: ${formData.receiving_spouse_education}` : ''}
${formData.receiving_spouse_earning_capacity ? `- Earning Capacity: ${formData.receiving_spouse_earning_capacity}` : ''}
${formData.time_needed_for_training ? `- Time Needed for Job Training: ${formData.time_needed_for_training}` : ''}

Standard of Living During Marriage:
${formData.marital_standard_of_living || 'Standard of living established during the marriage to be considered'}

SUPPORT TERMS:
──────────────────────────────────────
Support Amount and Duration:
${formData.support_amount ? `- Monthly Support Amount: $${formData.support_amount}` : '- Amount to be determined based on needs and ability to pay'}
${formData.support_duration ? `- Duration: ${formData.support_duration}` : '- Duration to be determined based on marriage length'}
${formData.temporary_vs_permanent ? `- Type: ${formData.temporary_vs_permanent}` : ''}
${formData.step_down_provisions ? `- Step-Down: ${formData.step_down_provisions}` : ''}

Payment Details:
${formData.payment_method ? `- Payment Method: ${formData.payment_method}` : '- Payment Method: To be specified (direct, wage assignment)'}
${formData.payment_date ? `- Payment Due: ${formData.payment_date}` : '- Due: First day of each month'}

Tax Treatment:
${formData.tax_treatment || 'Tax treatment: Post-2019 support orders are NOT deductible/taxable per federal tax law changes'}

Termination Events:
${formData.termination_events || 'Support terminates on remarriage, death of either party, or cohabitation with non-marital partner per FC § 4337'}

CRITICAL LEGAL REQUIREMENTS:
══════════════════════════════════════
1. **Family Code § 4320 Factors** (ABSOLUTELY MANDATORY - All 14 Factors):
   The Court MUST consider ALL of the following factors per FC § 4320:

   ✓ (a) Extent to which supported party's earning capacity is sufficient to maintain marital standard of living
   ✓ (b) Extent to which supported party contributed to supporting party's education, career, or license
   ✓ (c) Ability of supporting party to pay, considering their earning capacity, assets, and standard of living
   ✓ (d) Needs of each party based on marital standard of living
   ✓ (e) Obligations and assets (including separate property) of each party
   ✓ (f) Duration of the marriage
   ✓ (g) Ability of supported party to engage in gainful employment without unduly interfering with interests of dependent children
   ✓ (h) Age and health of the parties
   ✓ (i) Documented history of domestic violence (if applicable)
   ✓ (j) Immediate and specific tax consequences to each party
   ✓ (k) Balance of hardships to each party
   ✓ (l) Goal that supported party shall be self-supporting within reasonable period (presumptively 1/2 length of marriage for short marriages)
   ✓ (m) Any other factors the court determines are just and equitable
   ✓ (n) Criminal conviction of abusive spouse (reduces or eliminates support)

   MUST address each applicable factor with specific findings!

2. **Marriage Length and Duration Rules** (MANDATORY):
   ✓ SHORT-TERM MARRIAGE (under 10 years):
     • Support typically terminates at 1/2 the length of the marriage
     • Example: 6-year marriage → 3 years of support
     • Court may deviate based on § 4320 factors

   ✓ LONG-TERM MARRIAGE (10+ years):
     • Court retains jurisdiction indefinitely (FC § 4336)
     • No automatic termination date
     • Goal of self-sufficiency still applies but more flexible
     • Support may be for an extended or indefinite period

3. **Automatic Termination Events** (MANDATORY per FC § 4337):
   ✓ Death of either party
   ✓ Remarriage of receiving spouse
   ✓ Cohabitation of receiving spouse with non-marital partner (rebuttable presumption of decreased need)
   ✓ MUST include these termination provisions

4. **Modification Provisions** (MANDATORY):
   ✓ Support is modifiable upon change in circumstances (FC § 3651)
   ✓ Either party may request modification
   ✓ Burden is on party seeking modification to show material change
   ✓ Cannot modify retroactively before filing date
   ✓ Parties may agree to make support non-modifiable (rare, must be explicit)

5. **Tax Treatment** (MANDATORY Statement):
   ✓ For divorces/separations after December 31, 2018:
     • Spousal support is NOT tax-deductible for payor
     • Spousal support is NOT taxable income for payee
     • Federal Tax Cuts and Jobs Act of 2017 changed tax treatment
   ✓ For divorces before January 1, 2019:
     • Support may still be deductible/taxable under old rules if not modified

6. **Reservation of Jurisdiction vs. Termination**:
   ✓ Court may reserve jurisdiction to award support later (even if $0 now)
   ✓ Termination of jurisdiction = cannot award support later
   ✓ Waiver of support = cannot request support later (very rare, must be knowing waiver)
   ✓ Be clear about reservation vs. termination

7. **Payment Terms** (MANDATORY):
   ✓ Specify exact monthly amount
   ✓ Payment due date (typically 1st of month)
   ✓ Payment method (wage assignment possible per FC § 5230, but less common than child support)
   ✓ Interest on arrears at 10% per annum (FC § 4338)
   ✓ Lump sum vs. periodic payments

8. **Step-Down or Step-Up Provisions** (if applicable):
   ✓ Support may increase or decrease over time based on anticipated events
   ✓ Example: "Support shall be $3,000/month for 2 years, then $2,000/month for 2 years, then $1,000/month for 2 years"
   ✓ Recognizes expectation of increasing self-sufficiency

EXACT FORMAT REQUIREMENTS:
══════════════════════════════════════
Header Block:
\`\`\`
SUPERIOR COURT OF CALIFORNIA
COUNTY OF ${formData.county.toUpperCase()}

In re the Marriage of                    Case No.: ________________

${formData.paying_spouse ? formData.paying_spouse.toUpperCase() : 'PETITIONER'},
                                         SPOUSAL SUPPORT ORDER
              Petitioner/Payor,          (ORDER AFTER HEARING OR STIPULATION)
and
                                         (Family Code §§ 4320, 4330, 4336)
${formData.receiving_spouse ? formData.receiving_spouse.toUpperCase() : 'RESPONDENT'},

              Respondent/Payee.
\`\`\`

Document Structure (use THIS EXACT format):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
I. PARTIES AND JURISDICTION
   [Party information, county, marriage details]

II. MARRIAGE DURATION
   [Date of marriage, separation, length - short vs. long-term]

III. FINDINGS UNDER FAMILY CODE § 4320
   [MANDATORY: Address all 14 factors with specific findings for each applicable factor]
   A. Supported Party's Earning Capacity (§ 4320(a))
   B. Contributions to Education/Career (§ 4320(b))
   C. Ability to Pay (§ 4320(c))
   D. Needs and Marital Standard of Living (§ 4320(d))
   E. Assets and Obligations (§ 4320(e))
   F. Duration of Marriage (§ 4320(f))
   G. Employment and Children (§ 4320(g))
   H. Age and Health (§ 4320(h))
   I. Domestic Violence (§ 4320(i)) [if applicable]
   J. Tax Consequences (§ 4320(j))
   K. Balance of Hardships (§ 4320(k))
   L. Goal of Self-Sufficiency (§ 4320(l))
   M. Other Just and Equitable Factors (§ 4320(m))

IV. INCOME FINDINGS
   [Paying spouse income/assets/ability, receiving spouse income/needs]

V. SPOUSAL SUPPORT ORDER
   [Amount, duration, when support begins]

VI. PAYMENT TERMS
   [Due date, payment method, where to pay]

VII. TAX TREATMENT
   [Federal tax law - not deductible/taxable for post-2018 orders]

VIII. DURATION AND TERMINATION
   [End date if short-term marriage, indefinite if long-term, automatic termination events]

IX. MODIFICATION AND RESERVATION OF JURISDICTION
   [Right to modify, court retains jurisdiction, burden of proof]

X. ARREARS AND INTEREST
   [Interest on unpaid support, enforcement]

XI. GENERAL PROVISIONS
   [Income and expense declarations, entire agreement if stipulation]

XII. SIGNATURE BLOCKS
   [Judge signature or both parties if stipulation]

WRITING STYLE REQUIREMENTS:
══════════════════════════════════════
✓ Use FORMAL, JUDICIAL language ("The Court finds...", "The Court orders...")
✓ Be EXTREMELY THOROUGH in addressing § 4320 factors
✓ Use THIRD PERSON consistently
✓ Reference SPECIFIC Family Code sections (§ 4320, § 4330, § 4336, § 4337)
✓ Include EXACT amounts and dates
✓ Be CLEAR about duration (specific end date or indefinite)
✓ Use proper legal terms (spousal support not alimony, payor/payee or obligor/obligee)
✓ Number paragraphs clearly (1, 2, 3, with subparagraphs a, b, c)
✓ Show reasoning for support amount (balance needs vs. ability to pay)

TONE EXAMPLES:
✓ CORRECT: "The Court finds, pursuant to Family Code Section 4320(h), that Payee is 58 years old and suffers from chronic arthritis that limits her ability to work full-time. Payor is 60 years old and in good health with full earning capacity. This factor weighs in favor of awarding spousal support."
✗ WRONG: "She's older and has arthritis so she needs money."

✓ CORRECT: "This was a marriage of fifteen (15) years duration, qualifying as a long-term marriage under California law. Pursuant to Family Code Section 4336, the Court retains jurisdiction over spousal support indefinitely. However, the Court finds that Payee should be able to become self-supporting within a reasonable period of time, approximately seven (7) years."
✗ WRONG: "They were married 15 years so support can go on forever."

✓ CORRECT: "Payor shall pay spousal support to Payee in the amount of Two Thousand Five Hundred Dollars ($2,500.00) per month, payable on the first day of each month, commencing January 1, 2025. Said support shall terminate upon the death of either party, remarriage of Payee, or Payee's cohabitation with a non-marital partner as defined in Family Code Section 4337, whichever occurs first."
✗ WRONG: "He'll pay her $2,500 a month starting January until she remarries or dies."

§ 4320 FACTOR ANALYSIS EXAMPLE:
✓ CORRECT: "Pursuant to Family Code Section 4320(a) and (d), the Court finds that Payee earned $35,000 annually during the marriage as a part-time teacher's aide, while the parties enjoyed a marital standard of living of approximately $120,000 annually. Payee's current earning capacity of $35,000 is insufficient to maintain the marital standard of living. Payee has skills and education but would require additional training to increase earning capacity significantly."
✗ WRONG: "Wife doesn't make enough to live like they used to."

OUTPUT INSTRUCTIONS:
══════════════════════════════════════
Generate ONLY the spousal support order document text, ready to file or submit to court.

DO NOT INCLUDE:
✗ Explanatory notes or instructions
✗ Bracketed placeholders like [INSERT AMOUNT]
✗ Legal advice to the parties
✗ "This is a draft" disclaimers
✗ Instructions to attorneys

DO INCLUDE:
✓ Thorough analysis of ALL applicable § 4320 factors
✓ Specific income amounts and support calculation reasoning
✓ All required Family Code citations
✓ Complete payment terms and termination provisions
✓ Clear statement on duration (end date or indefinite with reservation)
✓ Professional, judicial tone throughout

START with the case caption header.
END with the signature block.

Generate the complete, court-ready spousal support order now:`

    default:
      // Default prompt for any other templates
      return `Generate a ${template.name} for California jurisdiction with the following information:

${JSON.stringify(formData, null, 2)}

REQUIREMENTS:
1. Use formal legal language appropriate for family law
2. Include all necessary legal elements
3. Use proper legal citation format
4. Be professional and clear
5. Include appropriate signature blocks

Generate the complete document text now:`
  }
}

async function createDocx(
  templateName: string,
  formData: any,
  generatedText: string
): Promise<Buffer> {
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440, // 1 inch in twips
            bottom: 1440,
            left: 1440,
            right: 1440,
          },
        },
      },
      children: [
        // Header
        new Paragraph({
          text: templateName.toUpperCase(),
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),

        // AI-generated content (properly formatted with case caption from AI)
        // Split generated text into paragraphs
        ...generatedText.split('\n\n').map(para =>
          new Paragraph({
            text: para,
            spacing: { after: 200 },
          })
        ),

        // Footer
        new Paragraph({
          text: `Generated on ${new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}`,
          alignment: AlignmentType.CENTER,
          spacing: { before: 400 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'This document was generated using LegalDocAuto. Please review carefully before filing.',
              italics: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),

        // Powered By Footer
        new Paragraph({
          text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          alignment: AlignmentType.CENTER,
          spacing: { before: 300, after: 100 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: 'Generated by Legal Doc Automation',
              bold: true,
              size: 22,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 50 },
        }),

        new Paragraph({
          text: 'Create your own at: legaldocautomation.com',
          alignment: AlignmentType.CENTER,
          spacing: { after: 50 },
        }),

        new Paragraph({
          children: [
            new TextRun({
              text: '100% Free | No Credit Card Required',
              italics: true,
              size: 20,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
        }),

        new Paragraph({
          text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          alignment: AlignmentType.CENTER,
        }),
      ],
    }],
  })

  // Generate buffer using Packer (from docx library)
  const { Packer } = await import('docx')
  return await Packer.toBuffer(doc)
}
