import { Resend } from 'resend'

// Initialize Resend with API key from environment
// Free tier: 3,000 emails/month, 100 emails/day
const resend = new Resend(process.env.RESEND_API_KEY || '')

export async function sendWelcomeEmail(to: string, fullName: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Legal Doc Automation <onboarding@legaldocautomation.com>',
      to: [to],
      subject: 'Welcome to Legal Doc Automation',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
    <h1 style="color: #1a202c; margin: 0;">Welcome to Legal Doc Automation!</h1>
  </div>

  <div style="background: white; padding: 30px; border-radius: 10px; border: 1px solid #e2e8f0;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${fullName},</p>

    <p style="margin-bottom: 20px;">Thank you for signing up! We're excited to help you create professional, court-ready legal documents quickly and easily.</p>

    <h2 style="color: #2d3748; font-size: 18px; margin-top: 30px; margin-bottom: 15px;">🎉 Your Trial Includes:</h2>
    <ul style="margin-bottom: 25px; padding-left: 20px;">
      <li style="margin-bottom: 10px;"><strong>3 Free Documents</strong> - Try any of our templates</li>
      <li style="margin-bottom: 10px;"><strong>7 Days Access</strong> - Explore all features</li>
      <li style="margin-bottom: 10px;"><strong>AI-Powered Generation</strong> - Professional legal language</li>
      <li style="margin-bottom: 10px;"><strong>Instant Downloads</strong> - DOCX & PDF formats</li>
    </ul>

    <h2 style="color: #2d3748; font-size: 18px; margin-top: 30px; margin-bottom: 15px;">📝 Available Templates:</h2>
    <ul style="margin-bottom: 25px; padding-left: 20px;">
      <li style="margin-bottom: 8px;">Divorce Petition (FL-100)</li>
      <li style="margin-bottom: 8px;">Custody Agreement</li>
      <li style="margin-bottom: 8px;">Property Settlement Agreement</li>
      <li style="margin-bottom: 8px;">Child Support Calculation</li>
      <li style="margin-bottom: 8px;">Spousal Support Request</li>
    </ul>

    <div style="text-align: center; margin: 40px 0;">
      <a href="https://legaldocautomation.com/documents/new" style="display: inline-block; background: #3b82f6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Create Your First Document
      </a>
    </div>

    <div style="background: #fef3c7; border: 2px solid #fbbf24; border-radius: 8px; padding: 20px; margin-top: 30px;">
      <p style="margin: 0; color: #92400e;"><strong>⚠️ Important Reminder:</strong> This service generates document templates only. We strongly recommend having any documents reviewed by a licensed attorney before filing. We do not provide legal advice.</p>
    </div>

    <h2 style="color: #2d3748; font-size: 18px; margin-top: 30px; margin-bottom: 15px;">💡 Tips for Success:</h2>
    <ol style="margin-bottom: 25px; padding-left: 20px;">
      <li style="margin-bottom: 10px;">Gather all relevant information before starting</li>
      <li style="margin-bottom: 10px;">Use the tooltips (?) for guidance on each field</li>
      <li style="margin-bottom: 10px;">Preview your document before generating</li>
      <li style="margin-bottom: 10px;">Have an attorney review before filing</li>
    </ol>

    <p style="margin-top: 30px; margin-bottom: 10px;">Need help? Reply to this email or visit our support page.</p>

    <p style="margin-bottom: 0;">Best regards,<br>The Legal Doc Automation Team</p>
  </div>

  <div style="text-align: center; padding: 20px; color: #718096; font-size: 12px;">
    <p style="margin-bottom: 10px;">
      <a href="https://legaldocautomation.com/legal/terms" style="color: #3b82f6; text-decoration: none; margin: 0 10px;">Terms of Service</a>
      <a href="https://legaldocautomation.com/legal/privacy" style="color: #3b82f6; text-decoration: none; margin: 0 10px;">Privacy Policy</a>
      <a href="https://legaldocautomation.com/legal/disclaimer" style="color: #3b82f6; text-decoration: none; margin: 0 10px;">Legal Disclaimer</a>
    </p>
    <p>© 2025 Legal Doc Automation. All rights reserved.</p>
  </div>
</body>
</html>
      `,
    })

    if (error) {
      console.error('Error sending welcome email:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Failed to send welcome email:', error)
    return { success: false, error }
  }
}

export async function sendDocumentGeneratedEmail(
  to: string,
  fullName: string,
  documentTitle: string,
  documentId: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Legal Doc Automation <documents@legaldocautomation.com>',
      to: [to],
      subject: `Your ${documentTitle} is ready!`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #10b981; padding: 30px; border-radius: 10px; margin-bottom: 30px; text-align: center;">
    <h1 style="color: white; margin: 0;">✓ Document Generated Successfully!</h1>
  </div>

  <div style="background: white; padding: 30px; border-radius: 10px; border: 1px solid #e2e8f0;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${fullName},</p>

    <p style="margin-bottom: 20px;">Great news! Your <strong>${documentTitle}</strong> has been generated and is ready to download.</p>

    <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
      <p style="color: #718096; font-size: 14px; margin-bottom: 15px;">DOCUMENT READY</p>
      <p style="font-size: 20px; font-weight: 600; color: #1a202c; margin-bottom: 20px;">${documentTitle}</p>
      <a href="https://legaldocautomation.com/documents/${documentId}" style="display: inline-block; background: #3b82f6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        View & Download Document
      </a>
    </div>

    <h2 style="color: #2d3748; font-size: 18px; margin-top: 30px; margin-bottom: 15px;">📋 Next Steps:</h2>
    <ol style="margin-bottom: 25px; padding-left: 20px;">
      <li style="margin-bottom: 12px;"><strong>Review the document carefully</strong> - Check all information for accuracy</li>
      <li style="margin-bottom: 12px;"><strong>Have an attorney review it</strong> - We strongly recommend professional review before filing</li>
      <li style="margin-bottom: 12px;"><strong>Make any necessary edits</strong> - You can download and modify in Word</li>
      <li style="margin-bottom: 12px;"><strong>File with the appropriate court</strong> - Follow your local court's filing procedures</li>
    </ol>

    <div style="background: #fef3c7; border: 2px solid #fbbf24; border-radius: 8px; padding: 20px; margin-top: 30px;">
      <p style="margin: 0; color: #92400e;"><strong>⚠️ Important:</strong> This document is a template generated by AI. It should be reviewed by a licensed California family law attorney before filing with any court. We do not provide legal advice or representation.</p>
    </div>

    <p style="margin-top: 30px; margin-bottom: 10px;">Need to make changes or have questions?</p>
    <p style="margin-bottom: 0;">Reply to this email and we'll help you out.</p>

    <p style="margin-top: 30px; margin-bottom: 0;">Best regards,<br>The Legal Doc Automation Team</p>
  </div>

  <div style="text-align: center; padding: 20px; color: #718096; font-size: 12px;">
    <p style="margin-bottom: 10px;">
      <a href="https://legaldocautomation.com/dashboard" style="color: #3b82f6; text-decoration: none; margin: 0 10px;">Dashboard</a>
      <a href="https://legaldocautomation.com/documents" style="color: #3b82f6; text-decoration: none; margin: 0 10px;">My Documents</a>
      <a href="https://legaldocautomation.com/support" style="color: #3b82f6; text-decoration: none; margin: 0 10px;">Support</a>
    </p>
    <p>© 2025 Legal Doc Automation. All rights reserved.</p>
  </div>
</body>
</html>
      `,
    })

    if (error) {
      console.error('Error sending document generated email:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Failed to send document generated email:', error)
    return { success: false, error }
  }
}

export async function sendTrialExpiringEmail(
  to: string,
  fullName: string,
  daysRemaining: number
) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Legal Doc Automation <billing@legaldocautomation.com>',
      to: [to],
      subject: `Your trial expires in ${daysRemaining} days`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #fbbf24; padding: 30px; border-radius: 10px; margin-bottom: 30px; text-align: center;">
    <h1 style="color: #78350f; margin: 0;">⏰ Trial Ending Soon</h1>
  </div>

  <div style="background: white; padding: 30px; border-radius: 10px; border: 1px solid #e2e8f0;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${fullName},</p>

    <p style="margin-bottom: 20px;">Your Legal Doc Automation trial expires in <strong>${daysRemaining} days</strong>. We hope you've found the service helpful!</p>

    <div style="background: #f8f9fa; border-radius: 8px; padding: 25px; margin: 30px 0;">
      <h2 style="color: #2d3748; font-size: 20px; margin-top: 0; margin-bottom: 20px; text-align: center;">Choose Your Plan</h2>

      <div style="background: white; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 15px;">
        <h3 style="color: #1a202c; font-size: 18px; margin-top: 0; margin-bottom: 10px;">Basic Plan - $29/month</h3>
        <ul style="color: #4b5563; margin: 0; padding-left: 20px;">
          <li>10 documents per month</li>
          <li>All document templates</li>
          <li>AI-powered generation</li>
          <li>Download in DOCX & PDF</li>
        </ul>
      </div>

      <div style="background: white; border: 3px solid #3b82f6; border-radius: 8px; padding: 20px; position: relative;">
        <div style="position: absolute; top: -12px; right: 20px; background: #3b82f6; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600;">POPULAR</div>
        <h3 style="color: #1a202c; font-size: 18px; margin-top: 0; margin-bottom: 10px;">Pro Plan - $99/month</h3>
        <ul style="color: #4b5563; margin: 0; padding-left: 20px;">
          <li><strong>Unlimited documents</strong></li>
          <li>All document templates</li>
          <li>Priority AI generation</li>
          <li>Attorney review option</li>
          <li>Email support</li>
        </ul>
      </div>

      <div style="text-align: center; margin-top: 25px;">
        <a href="https://legaldocautomation.com/billing" style="display: inline-block; background: #3b82f6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Upgrade Now
        </a>
      </div>
    </div>

    <p style="margin-bottom: 10px;"><strong>What happens after trial?</strong></p>
    <p style="margin-bottom: 20px; color: #4b5563;">Don't worry - you won't be charged automatically. Your account will simply be paused, and you can upgrade anytime to continue creating documents.</p>

    <p style="margin-top: 30px; margin-bottom: 0;">Questions about pricing? Reply to this email and we'll help you choose the right plan.</p>

    <p style="margin-top: 30px; margin-bottom: 0;">Best regards,<br>The Legal Doc Automation Team</p>
  </div>

  <div style="text-align: center; padding: 20px; color: #718096; font-size: 12px;">
    <p style="margin-bottom: 10px;">
      <a href="https://legaldocautomation.com/billing" style="color: #3b82f6; text-decoration: none; margin: 0 10px;">View Plans</a>
      <a href="https://legaldocautomation.com/support" style="color: #3b82f6; text-decoration: none; margin: 0 10px;">Contact Support</a>
    </p>
    <p>© 2025 Legal Doc Automation. All rights reserved.</p>
  </div>
</body>
</html>
      `,
    })

    if (error) {
      console.error('Error sending trial expiring email:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Failed to send trial expiring email:', error)
    return { success: false, error }
  }
}

// Export all email functions
export const emailService = {
  sendWelcomeEmail,
  sendDocumentGeneratedEmail,
  sendTrialExpiringEmail,
}
