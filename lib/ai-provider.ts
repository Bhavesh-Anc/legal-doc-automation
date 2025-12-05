// lib/ai-provider.ts
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize clients
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
}) : null

const googleAI = process.env.GOOGLE_AI_KEY ? new GoogleGenerativeAI(
  process.env.GOOGLE_AI_KEY
) : null

export type AIProvider = 'openai' | 'claude' | 'gemini' | 'test'

export interface AIGenerationOptions {
  provider?: AIProvider
  systemPrompt: string
  userPrompt: string
  temperature?: number
  maxTokens?: number
}

/**
 * Generate text using the specified AI provider with automatic fallback
 */
export async function generateWithAI(options: AIGenerationOptions): Promise<string> {
  const {
    provider = 'openai',
    systemPrompt,
    userPrompt,
    temperature = 0.2,
    maxTokens = 2000,
  } = options

  // Try specified provider first
  try {
    switch (provider) {
      case 'openai':
        if (openai) {
          return await generateWithOpenAI(systemPrompt, userPrompt, temperature, maxTokens)
        }
        break
      case 'claude':
        if (anthropic) {
          return await generateWithClaude(systemPrompt, userPrompt, temperature, maxTokens)
        }
        break
      case 'gemini':
        if (googleAI) {
          return await generateWithGemini(systemPrompt, userPrompt, temperature, maxTokens)
        }
        break
      case 'test':
        return generateTestContent(userPrompt)
    }
  } catch (error: any) {
    console.error(`${provider} generation failed:`, error)
    // Continue to fallback logic below
  }

  // Fallback chain: OpenAI → Claude → Gemini → Test
  const fallbackProviders: AIProvider[] = ['openai', 'claude', 'gemini', 'test']

  for (const fallbackProvider of fallbackProviders) {
    if (fallbackProvider === provider) continue // Skip already tried provider

    try {
      switch (fallbackProvider) {
        case 'openai':
          if (openai) {
            console.log('Falling back to OpenAI')
            return await generateWithOpenAI(systemPrompt, userPrompt, temperature, maxTokens)
          }
          break
        case 'claude':
          if (anthropic) {
            console.log('Falling back to Claude')
            return await generateWithClaude(systemPrompt, userPrompt, temperature, maxTokens)
          }
          break
        case 'gemini':
          if (googleAI) {
            console.log('Falling back to Gemini')
            return await generateWithGemini(systemPrompt, userPrompt, temperature, maxTokens)
          }
          break
        case 'test':
          console.log('Falling back to test mode')
          return generateTestContent(userPrompt)
      }
    } catch (error: any) {
      console.error(`${fallbackProvider} fallback failed:`, error)
      continue
    }
  }

  // If all providers fail, return test content
  return generateTestContent(userPrompt)
}

/**
 * Generate text using OpenAI GPT-4
 */
async function generateWithOpenAI(
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  maxTokens: number
): Promise<string> {
  if (!openai) {
    throw new Error('OpenAI client not initialized')
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini', // Fast and cost-effective
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature,
    max_tokens: maxTokens,
  })

  return completion.choices[0].message.content || ''
}

/**
 * Generate text using Anthropic Claude
 */
async function generateWithClaude(
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  maxTokens: number
): Promise<string> {
  if (!anthropic) {
    throw new Error('Anthropic client not initialized')
  }

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022', // Latest Claude model
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: [
      { role: 'user', content: userPrompt },
    ],
  })

  const contentBlock = message.content[0]
  if (contentBlock.type === 'text') {
    return contentBlock.text
  }

  throw new Error('Unexpected Claude response format')
}

/**
 * Generate text using Google Gemini
 */
async function generateWithGemini(
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  maxTokens: number
): Promise<string> {
  if (!googleAI) {
    throw new Error('Google AI client not initialized')
  }

  const model = googleAI.getGenerativeModel({
    model: 'gemini-1.5-flash', // Fast and cost-effective
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  })

  const result = await model.generateContent([
    { text: systemPrompt },
    { text: userPrompt },
  ])

  const response = result.response
  return response.text()
}

/**
 * Generate mock content for testing without AI APIs
 */
function generateTestContent(prompt: string): string {
  // Extract template type from prompt if possible
  const isDivorce = prompt.toLowerCase().includes('divorce') || prompt.toLowerCase().includes('dissolution')
  const isCustody = prompt.toLowerCase().includes('custody')
  const isProperty = prompt.toLowerCase().includes('property')
  const isChildSupport = prompt.toLowerCase().includes('child support')
  const isSpousalSupport = prompt.toLowerCase().includes('spousal support') || prompt.toLowerCase().includes('alimony')

  if (isDivorce) {
    return generateDivorceMock(prompt)
  } else if (isCustody) {
    return generateCustodyMock(prompt)
  } else if (isProperty) {
    return generatePropertyMock(prompt)
  } else if (isChildSupport) {
    return generateChildSupportMock(prompt)
  } else if (isSpousalSupport) {
    return generateSpousalSupportMock(prompt)
  }

  return `TEST DOCUMENT

This is a test document generated without AI.

Request Details:
${prompt}

Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

[This is test mode. Configure AI API keys for full functionality.]`
}

function generateDivorceMock(prompt: string): string {
  // Extract basic info from prompt if possible
  const lines = prompt.split('\n')
  let petitioner = 'PETITIONER NAME'
  let respondent = 'RESPONDENT NAME'
  let county = 'LOS ANGELES'
  let marriageDate = 'MM/DD/YYYY'
  let separationDate = 'MM/DD/YYYY'

  for (const line of lines) {
    if (line.includes('Petitioner:')) petitioner = line.split(':')[1]?.trim() || petitioner
    if (line.includes('Respondent:')) respondent = line.split(':')[1]?.trim() || respondent
    if (line.includes('County:')) county = line.split(':')[1]?.trim().toUpperCase() || county
    if (line.includes('Date of Marriage:')) marriageDate = line.split(':')[1]?.trim() || marriageDate
    if (line.includes('Date of Separation:')) separationDate = line.split(':')[1]?.trim() || separationDate
  }

  return `SUPERIOR COURT OF CALIFORNIA
COUNTY OF ${county}

In re the Marriage of:
${petitioner} (Petitioner)
and
${respondent} (Respondent)

PETITION FOR DISSOLUTION OF MARRIAGE
(Family Law - Form FL-100)

1. JURISDICTIONAL STATEMENTS

The Petitioner, ${petitioner}, respectfully petitions this Court for a dissolution of marriage and states as follows:

The Petitioner has been a resident of the State of California for more than six (6) months and a resident of ${county} County for more than three (3) months immediately preceding the filing of this Petition, thereby establishing jurisdiction pursuant to California Family Code § 2320.

2. MARRIAGE AND SEPARATION

The parties were married on ${marriageDate} and separated on ${separationDate}. The marriage is irretrievably broken due to irreconcilable differences pursuant to California Family Code § 2310.

3. MINOR CHILDREN

[This section requires review based on whether parties have minor children]

4. COMMUNITY PROPERTY

[This section requires review based on community property status]

5. RELIEF REQUESTED

WHEREFORE, Petitioner prays that this Court:

a) Grant a dissolution of marriage;
b) Determine and divide all community property and community debts equitably;
c) Grant such other and further relief as the Court deems just and proper.

Dated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

Respectfully submitted,

_________________________
${petitioner}
Petitioner, In Pro Per

[This is a test document generated for demonstration purposes. Please review with an attorney before filing.]`
}

function generateCustodyMock(prompt: string): string {
  return `SUPERIOR COURT OF CALIFORNIA
COUNTY OF [COUNTY NAME]

In re the Matter of:
[PARENT 1 NAME] (Petitioner)
and
[PARENT 2 NAME] (Respondent)

CHILD CUSTODY AND VISITATION AGREEMENT
(Family Law - Form FL-311)

1. PARTIES AND CHILDREN

This Agreement is entered into between the parties concerning the custody and visitation of the following minor child(ren):

[Child Name, Date of Birth]

2. LEGAL CUSTODY

The parties agree to [joint/sole] legal custody, meaning that [description of decision-making authority].

3. PHYSICAL CUSTODY

The parties agree to [joint/sole/primary] physical custody with the following schedule:

Regular Schedule:
- [Parent 1]: [Days and times]
- [Parent 2]: [Days and times]

Holidays and Special Occasions:
[Holiday schedule to be specified]

4. EXCHANGE ARRANGEMENTS

Exchanges shall occur at [location] at [time]. [Additional exchange provisions]

5. COMMUNICATION

Each parent shall have reasonable telephone and electronic communication with the child(ren) during the other parent's custody time.

6. RELOCATION

Neither party shall relocate more than [distance] miles without providing written notice to the other party at least [number] days in advance.

Dated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

[This is a test document. Please review with an attorney before filing.]`
}

function generatePropertyMock(prompt: string): string {
  return `SUPERIOR COURT OF CALIFORNIA
COUNTY OF [COUNTY NAME]

In re the Marriage of:
[PETITIONER NAME] (Petitioner)
and
[RESPONDENT NAME] (Respondent)

PROPERTY SETTLEMENT AGREEMENT

The parties agree to the following division of community property and debts:

1. REAL PROPERTY

[Details of real property division]

2. VEHICLES

[Details of vehicle division]

3. BANK ACCOUNTS

[Details of account division]

4. RETIREMENT ACCOUNTS

[Details of retirement account division]

5. PERSONAL PROPERTY

[Details of personal property division]

6. COMMUNITY DEBTS

[Details of debt allocation]

7. SPOUSAL WAIVER

[Spousal support waiver or agreement]

Each party represents that they have fully disclosed all assets and debts, and that this agreement is entered into freely and voluntarily.

Dated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

[This is a test document. Please review with an attorney before filing.]`
}

function generateChildSupportMock(prompt: string): string {
  return `SUPERIOR COURT OF CALIFORNIA
COUNTY OF [COUNTY NAME]

In re the Marriage of:
[PETITIONER NAME] (Petitioner)
and
[RESPONDENT NAME] (Respondent)

CHILD SUPPORT ORDER
(Family Law - Form FL-150)

1. INCOME INFORMATION

Petitioner's gross monthly income: $[AMOUNT]
Respondent's gross monthly income: $[AMOUNT]

2. CHILD SUPPORT CALCULATION

Based on California guideline calculation pursuant to Family Code § 4055:

Monthly child support: $[AMOUNT]
To be paid by: [PAYING PARENT]
To: [RECEIVING PARENT]

3. PAYMENT TERMS

Payment shall be made on the [DAY] of each month beginning [DATE].
Payment shall be made via [METHOD].

4. ADDITIONAL EXPENSES

Medical Insurance: [ALLOCATION]
Uninsured Medical Expenses: [ALLOCATION]
Childcare Expenses: [ALLOCATION]

5. DURATION

This order shall remain in effect until the child(ren) reach age 18 or graduate from high school, whichever occurs later, or until further order of the Court.

Dated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

[This is a test document. Please review with an attorney before filing.]`
}

function generateSpousalSupportMock(prompt: string): string {
  return `SUPERIOR COURT OF CALIFORNIA
COUNTY OF [COUNTY NAME]

In re the Marriage of:
[PETITIONER NAME] (Petitioner)
and
[RESPONDENT NAME] (Respondent)

SPOUSAL SUPPORT ORDER
(Family Law - Form FL-157)

1. FINDINGS

The Court finds that spousal support is appropriate based on the following factors pursuant to Family Code § 4320:

- Length of marriage: [DURATION]
- Earning capacity of each party
- Standard of living during marriage
- Age and health of parties

2. SUPPORT ORDER

[PAYING SPOUSE] shall pay to [RECEIVING SPOUSE] spousal support in the amount of $[AMOUNT] per month.

3. PAYMENT TERMS

Payment shall commence on [DATE] and continue until [TERMINATION EVENT/DATE].
Payment shall be made on the [DAY] of each month via [METHOD].

4. TAX TREATMENT

The parties acknowledge that under current federal tax law, spousal support is [tax treatment].

5. MODIFICATION AND TERMINATION

This order is modifiable upon a showing of material change in circumstances. Support shall automatically terminate upon [CONDITIONS].

Dated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

[This is a test document. Please review with an attorney before filing.]`
}

/**
 * Get available AI providers
 */
export function getAvailableProviders(): AIProvider[] {
  const providers: AIProvider[] = ['test'] // Always available

  if (openai) providers.unshift('openai')
  if (anthropic) providers.unshift('claude')
  if (googleAI) providers.unshift('gemini')

  return providers
}

/**
 * Check if a specific provider is available
 */
export function isProviderAvailable(provider: AIProvider): boolean {
  switch (provider) {
    case 'openai':
      return openai !== null
    case 'claude':
      return anthropic !== null
    case 'gemini':
      return googleAI !== null
    case 'test':
      return true
    default:
      return false
  }
}
