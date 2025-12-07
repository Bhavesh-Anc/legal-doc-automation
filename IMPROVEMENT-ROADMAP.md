# Product Improvement Roadmap

## Priority 1: Fix Document Generation Issues (1-2 hours)

### 1. Remove Placeholder Text
**Issue**: Document has `[INSERT MONTH]` placeholders
**Fix**: Update AI prompts to use actual dates from form data
**File**: `app/api/generate-document/route.ts` (buildPrompt function, line 200+)

### 2. Complete Document Output
**Issue**: Document cuts off before signature blocks
**Fix**: Ensure AI generates complete documents with signature sections
**Impact**: CRITICAL - documents need signatures to be court-ready

### 3. Remove "CASE INFORMATION" Section
**Issue**: Shows "N/A" values at top
**Fix**: Remove from DOCX template or populate with actual data
**File**: `app/api/generate-document/route.ts` (createDocx function, line 1292+)

---

## Priority 2: Complete Other Form Templates (8-12 hours)

**Currently**: Only Custody Agreement is fully implemented
**Need**: Implement the other 4 forms

### Forms to Complete:
1. ✅ Custody Agreement - DONE
2. ❌ Divorce Petition - Stub only
3. ❌ Property Settlement - Stub only
4. ❌ Child Support - Stub only
5. ❌ Spousal Support - Stub only

**How**: Copy pattern from `CustodyAgreementFormWrapper.tsx` to other wrappers

---

## Priority 3: Add PDF Preview (3-4 hours)

**Current**: Users see preview of form data, not actual document
**Better**: Show rendered PDF preview before generating

**Benefits**:
- Users see exactly what they're getting
- Reduces "this isn't what I expected" complaints
- Increases conversion (trust)

**Implementation**:
- Generate PDF on frontend with form data
- Show in modal before signup
- Use existing `generatePDF` function

---

## Priority 4: Add Document Editing (6-8 hours)

**Current**: Generate once, download, no edits
**Better**: Allow users to edit generated documents

**Features**:
- Edit document text in browser
- Regenerate with changes
- Save drafts

**Tech**: Use a rich text editor (Tiptap, Slate, or Draft.js)

---

## Priority 5: Analytics & Tracking (2-3 hours)

**Track**:
- Form starts (no signup required)
- Form completions
- Signup conversions
- Document generations
- Downloads
- Feedback submissions
- Exit intent popup shows/clicks

**Tools**: Posthog (free tier) or Google Analytics 4

**Why**: Understand conversion funnel, identify drop-offs

---

## Priority 6: Improve AI Generation Quality (2-3 hours)

### Issues to Fix:
1. Placeholder text in output
2. Inconsistent formatting
3. Missing signature blocks

### Solutions:
1. **Better prompts**: Add examples of perfect output
2. **Post-processing**: Strip placeholders, ensure completeness
3. **Validation**: Check for required sections before saving
4. **Fallback content**: If AI misses sections, add them manually

### Implementation:
```typescript
// Add validation function
function validateDocument(text: string): boolean {
  const requiredSections = [
    'SIGNATURE',
    'DECLARATION',
    'DATED',
  ]
  return requiredSections.every(section => text.includes(section))
}

// Add post-processing
function cleanDocument(text: string): string {
  // Remove placeholders
  text = text.replace(/\[INSERT [^\]]+\]/g, '_____________')

  // Add missing sections
  if (!text.includes('SIGNATURE')) {
    text += '\n\nSIGNATURE BLOCK:\n\n_____________________________\n[Party Name]\n'
  }

  return text
}
```

---

## Priority 7: Email Notifications (2-3 hours)

**Setup Resend** (see DEPLOYMENT-GUIDE.md)

**Send emails for**:
- Welcome email after signup
- Document generated (with download link)
- Trial ending soon (day 12 of 14)
- Trial ended (encourage upgrade)

**Why**: Increases engagement, drives repeat usage

---

## Priority 8: Add More States (4-6 hours per state)

**Currently**: California only
**Expand to**: Texas, Florida, New York, Illinois (highest divorce rates)

**Per state needed**:
- State-specific forms
- State laws/statutes
- Court forms
- Update AI prompts with state-specific requirements

**Priority order**:
1. Texas (high population, high divorce rate)
2. Florida
3. New York
4. Illinois

---

## Priority 9: Mobile Optimization (3-4 hours)

**Current**: Works on mobile but not optimized
**Improve**:
- Larger touch targets
- Better form layout on small screens
- Simplified navigation
- Mobile-friendly PDF viewer

---

## Priority 10: A/B Testing (Ongoing)

**Test**:
1. Exit popup copy variations
2. CTA button text ("Generate Free Document" vs "Create My Document")
3. Signup modal timing (immediate vs after preview)
4. Pricing page variations (when you add paid plans)

**Tools**: Vercel Analytics + A/B testing, or Optimizely

---

## Nice to Have (Future)

- [ ] Multi-language support (Spanish first)
- [ ] Document templates library (download without AI)
- [ ] Attorney directory/referrals (monetization)
- [ ] Document e-signing (DocuSign integration)
- [ ] Document filing service (file with court for user)
- [ ] Mobile app (React Native)
- [ ] Voice input for forms
- [ ] Chat support (Intercom or Crisp)

---

## Metrics to Track

### Week 1:
- Unique visitors
- Form starts
- Signups
- Documents generated
- Conversion rate (visitors → signups)

### Month 1:
- Total users
- Documents per user
- Feedback ratings
- Referral traffic from "Powered By" footer
- Most popular templates

### Quarter 1:
- Monthly recurring revenue (when paid)
- Churn rate
- Customer acquisition cost
- Lifetime value
- Viral coefficient

---

**Start with Priority 1-3 to get a solid v1.0, then move to marketing!**
