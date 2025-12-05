export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-6 text-gray-700">
        <section>
          <p className="text-lg mb-4">
            At Legal Doc Automation, we take your privacy seriously. This Privacy Policy explains how we collect, use,
            disclose, and safeguard your information when you use our service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Information We Collect</h2>

          <h3 className="font-semibold text-gray-900 mt-4 mb-2">Personal Information</h3>
          <p className="mb-2">We collect information that you provide directly to us, including:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Name and email address (for account creation)</li>
            <li>Organization name</li>
            <li>Payment information (processed securely through Stripe)</li>
            <li>Contact information (phone, address if provided)</li>
          </ul>

          <h3 className="font-semibold text-gray-900 mt-4 mb-2">Document Data</h3>
          <p className="mb-2">
            When you create documents, we collect and store the information you enter into forms, including:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Party names and contact information</li>
            <li>Case details (marriage dates, children information, property details, etc.)</li>
            <li>Generated document content</li>
          </ul>

          <h3 className="font-semibold text-gray-900 mt-4 mb-2">Usage Information</h3>
          <p className="mb-2">We automatically collect certain information about your device and usage:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Browser type and version</li>
            <li>IP address</li>
            <li>Pages visited and features used</li>
            <li>Time and date of visits</li>
            <li>Error logs and diagnostic information</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">2. How We Use Your Information</h2>
          <p className="mb-2">We use the information we collect to:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Provide the Service:</strong> Generate documents based on your input</li>
            <li><strong>Account Management:</strong> Create and manage your account</li>
            <li><strong>Process Payments:</strong> Handle billing and subscriptions</li>
            <li><strong>Send Communications:</strong> Send service updates, security alerts, and support messages</li>
            <li><strong>Improve the Service:</strong> Analyze usage patterns to enhance features and user experience</li>
            <li><strong>Ensure Security:</strong> Detect and prevent fraud, abuse, and technical issues</li>
            <li><strong>Legal Compliance:</strong> Comply with applicable laws and regulations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How We Share Your Information</h2>
          <p className="mb-3">
            We do not sell your personal information. We may share your information only in the following circumstances:
          </p>

          <h3 className="font-semibold text-gray-900 mt-3 mb-2">Service Providers</h3>
          <p className="mb-2">We share information with third-party service providers who perform services on our behalf:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><strong>Supabase:</strong> Database and authentication services</li>
            <li><strong>Stripe:</strong> Payment processing</li>
            <li><strong>OpenAI/Anthropic/Google:</strong> AI document generation</li>
            <li><strong>Resend:</strong> Email delivery</li>
            <li><strong>Sentry:</strong> Error tracking and monitoring</li>
          </ul>

          <h3 className="font-semibold text-gray-900 mt-4 mb-2">Legal Requirements</h3>
          <p>
            We may disclose your information if required to do so by law or in response to valid requests by public
            authorities (e.g., court orders, subpoenas).
          </p>

          <h3 className="font-semibold text-gray-900 mt-4 mb-2">Business Transfers</h3>
          <p>
            If we are involved in a merger, acquisition, or sale of assets, your information may be transferred as part
            of that transaction.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Data Security</h2>
          <p className="mb-2">
            We implement appropriate technical and organizational measures to protect your personal information:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Encryption in transit (HTTPS/TLS)</li>
            <li>Encryption at rest for sensitive data</li>
            <li>Secure authentication with Supabase</li>
            <li>Regular security audits and monitoring</li>
            <li>Access controls and role-based permissions</li>
          </ul>
          <p className="mt-3">
            However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive
            to protect your personal information, we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data Retention</h2>
          <p>
            We retain your personal information for as long as your account is active or as needed to provide you services.
            We will retain and use your information as necessary to comply with our legal obligations, resolve disputes,
            and enforce our agreements. You may request deletion of your account and data at any time by contacting support.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Your Rights and Choices</h2>
          <p className="mb-2">You have the following rights regarding your personal information:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
            <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
            <li><strong>Deletion:</strong> Request deletion of your personal information</li>
            <li><strong>Export:</strong> Request a copy of your data in a portable format</li>
            <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
          </ul>
          <p className="mt-3">
            To exercise these rights, please contact us at{' '}
            <a href="mailto:privacy@legaldocautomation.com" className="text-blue-600 hover:underline">
              privacy@legaldocautomation.com
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">7. California Privacy Rights (CCPA)</h2>
          <p>
            If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA),
            including the right to know what personal information we collect, the right to delete your information, and
            the right to opt-out of the sale of your information. We do not sell personal information.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Children's Privacy</h2>
          <p>
            Our Service is not intended for individuals under the age of 18. We do not knowingly collect personal
            information from children under 18. If you become aware that a child has provided us with personal information,
            please contact us immediately.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Cookies and Tracking</h2>
          <p className="mb-2">We use cookies and similar tracking technologies to:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Maintain your login session</li>
            <li>Remember your preferences</li>
            <li>Analyze site traffic and usage</li>
            <li>Improve user experience</li>
          </ul>
          <p className="mt-3">
            You can control cookies through your browser settings. Note that disabling cookies may affect the
            functionality of the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any material changes by posting
            the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this
            Privacy Policy periodically for any changes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Contact Us</h2>
          <p className="mb-2">
            If you have any questions about this Privacy Policy or our privacy practices, please contact us at:
          </p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p><strong>Email:</strong> <a href="mailto:privacy@legaldocautomation.com" className="text-blue-600 hover:underline">privacy@legaldocautomation.com</a></p>
            <p><strong>Support:</strong> <a href="mailto:support@legaldocautomation.com" className="text-blue-600 hover:underline">support@legaldocautomation.com</a></p>
          </div>
        </section>

        <div className="border-t border-gray-200 pt-6 mt-8">
          <p className="text-sm text-gray-500">
            <strong>Last Updated:</strong> January 2025
            <br />
            <strong>Effective Date:</strong> January 2025
          </p>
        </div>
      </div>
    </div>
  )
}
