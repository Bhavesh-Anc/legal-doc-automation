export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-6 text-gray-700">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
          <p>
            By accessing and using Legal Doc Automation ("the Service"), you accept and agree to be bound by the terms
            and provision of this agreement. If you do not agree to these Terms of Service, please do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Description of Service</h2>
          <p className="mb-3">
            Legal Doc Automation is a document automation platform that generates legal document templates based on user input.
            The Service uses artificial intelligence to create customized documents for family law matters.
          </p>
          <p className="font-semibold text-amber-900 bg-amber-50 p-4 rounded-lg">
            IMPORTANT: This Service is NOT a law firm and does NOT provide legal advice, opinions, or recommendations.
            The Service provides document templates only. You should consult with a licensed attorney for legal advice
            specific to your situation.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">3. No Attorney-Client Relationship</h2>
          <p>
            Use of this Service does not create an attorney-client relationship between you and Legal Doc Automation or
            any of its operators, employees, or affiliates. The Service is not a substitute for legal advice from a
            qualified attorney licensed in your jurisdiction.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">4. User Responsibilities</h2>
          <p className="mb-2">By using this Service, you agree to:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Provide accurate and complete information when creating documents</li>
            <li>Review all generated documents carefully before use</li>
            <li>Have documents reviewed by a licensed attorney before filing or relying on them</li>
            <li>Comply with all applicable laws and court rules</li>
            <li>Not use the Service for any unlawful purpose</li>
            <li>Maintain the security of your account credentials</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">5. No Warranties or Guarantees</h2>
          <p className="mb-2">
            The Service is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, either express or implied.
            We specifically disclaim:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Any guarantee that documents will be accepted by courts</li>
            <li>Any warranty of accuracy, completeness, or fitness for a particular purpose</li>
            <li>Any warranty that the Service will be uninterrupted or error-free</li>
            <li>Any warranty regarding the outcome of legal proceedings</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Legal Doc Automation and its operators shall not be liable for any
            direct, indirect, incidental, special, consequential, or punitive damages resulting from your use or inability
            to use the Service, including but not limited to damages for errors in documents, rejected filings, adverse
            legal outcomes, or lost business opportunities.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Subscription and Payment</h2>
          <p className="mb-2">
            The Service offers various subscription tiers with different features and document limits:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Trial:</strong> Free for 7 days with up to 3 documents</li>
            <li><strong>Basic:</strong> Monthly subscription with defined document limits</li>
            <li><strong>Pro:</strong> Monthly subscription with higher or unlimited documents</li>
          </ul>
          <p className="mt-3">
            Payment is processed through Stripe. You agree to pay all fees associated with your chosen subscription tier.
            Subscriptions automatically renew unless cancelled before the renewal date.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Refund Policy</h2>
          <p>
            Due to the nature of digital document services, all sales are final. However, if you experience technical issues
            that prevent you from using the Service, please contact support and we will work to resolve the issue or provide
            a refund at our discretion.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Data and Privacy</h2>
          <p>
            Your use of the Service is also governed by our Privacy Policy. We collect and use your information as described
            in our Privacy Policy. By using the Service, you consent to such collection and use.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Intellectual Property</h2>
          <p>
            The Service, including its original content, features, and functionality, is owned by Legal Doc Automation and
            is protected by international copyright, trademark, and other intellectual property laws. You retain ownership
            of documents you create using the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Termination</h2>
          <p>
            We reserve the right to terminate or suspend your account and access to the Service at our sole discretion,
            without notice, for conduct that we believe violates these Terms of Service or is harmful to other users,
            us, or third parties.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms of Service at any time. We will notify users of any material changes
            by email or through the Service. Your continued use of the Service after such modifications constitutes your
            acceptance of the updated terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Governing Law</h2>
          <p>
            These Terms of Service shall be governed by and construed in accordance with the laws of the State of California,
            without regard to its conflict of law provisions.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">14. Contact Information</h2>
          <p>
            If you have any questions about these Terms of Service, please contact us at:
            <br />
            <a href="mailto:support@legaldocautomation.com" className="text-blue-600 hover:underline">
              support@legaldocautomation.com
            </a>
          </p>
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
