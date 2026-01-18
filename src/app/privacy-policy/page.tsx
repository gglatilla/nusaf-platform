import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-8">
        <div className="mb-8">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            NUSAF
          </Link>
          <span className="block text-sm text-muted-foreground">
            Dynamic Technologies
          </span>
        </div>

        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

        <div className="prose prose-gray max-w-none">
          <p className="text-muted-foreground mb-6">
            Last updated: January 2026
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Introduction</h2>
            <p className="text-muted-foreground mb-4">
              NUSAF Dynamic Technologies (Pty) Ltd (&quot;NUSAF&quot;, &quot;we&quot;, &quot;us&quot;, or
              &quot;our&quot;) respects your privacy and is committed to protecting your
              personal information in accordance with the Protection of Personal
              Information Act, 2013 (POPIA).
            </p>
            <p className="text-muted-foreground">
              This Privacy Policy explains how we collect, use, disclose, and
              protect your personal information when you use our website and
              services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              Information We Collect
            </h2>
            <p className="text-muted-foreground mb-4">
              We collect the following types of personal information:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                <strong>Account Information:</strong> Company name, contact
                person name, email address, phone number, physical address, and
                VAT number when you register for an account.
              </li>
              <li>
                <strong>Authentication Data:</strong> Login credentials
                (encrypted), login history, and device information for security
                purposes.
              </li>
              <li>
                <strong>Transaction Data:</strong> Quotes requested, orders
                placed, and related business correspondence.
              </li>
              <li>
                <strong>Technical Data:</strong> IP address, browser type, and
                device information collected automatically when you access our
                platform.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">
              How We Use Your Information
            </h2>
            <p className="text-muted-foreground mb-4">
              We use your personal information for the following purposes:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Processing and fulfilling your orders and requests</li>
              <li>Providing quotes and pricing information</li>
              <li>Managing your account and providing customer support</li>
              <li>Communicating about your orders, quotes, and account</li>
              <li>Protecting the security of our platform and your account</li>
              <li>Complying with legal obligations</li>
              <li>Improving our products and services</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Legal Basis</h2>
            <p className="text-muted-foreground mb-4">
              Under POPIA, we process your personal information based on:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                <strong>Consent:</strong> You have given us permission to
                process your information
              </li>
              <li>
                <strong>Contract:</strong> Processing is necessary to fulfill
                our contractual obligations to you
              </li>
              <li>
                <strong>Legal Obligation:</strong> Processing is required to
                comply with South African law
              </li>
              <li>
                <strong>Legitimate Interest:</strong> Processing is necessary
                for our legitimate business interests, balanced against your
                rights
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Data Sharing</h2>
            <p className="text-muted-foreground mb-4">
              We may share your information with:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                <strong>Service Providers:</strong> Third-party companies that
                help us operate our business (e.g., payment processors, delivery
                services)
              </li>
              <li>
                <strong>Business Partners:</strong> When necessary to fulfill
                your orders
              </li>
              <li>
                <strong>Legal Authorities:</strong> When required by law or to
                protect our rights
              </li>
            </ul>
            <p className="text-muted-foreground mt-4">
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Data Security</h2>
            <p className="text-muted-foreground mb-4">
              We implement appropriate technical and organizational measures to
              protect your personal information, including:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Encryption of sensitive data in transit and at rest</li>
              <li>Secure password hashing</li>
              <li>Regular security assessments</li>
              <li>Access controls and authentication requirements</li>
              <li>Employee training on data protection</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Data Retention</h2>
            <p className="text-muted-foreground">
              We retain your personal information for as long as necessary to
              fulfill the purposes for which it was collected, comply with legal
              obligations, resolve disputes, and enforce our agreements.
              Financial records are retained for the period required by South
              African tax law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Your Rights</h2>
            <p className="text-muted-foreground mb-4">
              Under POPIA, you have the right to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate or incomplete information</li>
              <li>Request deletion of your information (subject to legal requirements)</li>
              <li>Object to processing of your information</li>
              <li>Withdraw consent (where processing is based on consent)</li>
              <li>Lodge a complaint with the Information Regulator</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Cookies</h2>
            <p className="text-muted-foreground">
              We use essential cookies for authentication and to remember your
              preferences. These cookies are necessary for the platform to
              function properly. We do not use tracking or advertising cookies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will
              notify you of any significant changes by posting the new policy on
              our website and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
            <p className="text-muted-foreground mb-4">
              If you have questions about this Privacy Policy or wish to
              exercise your rights, please contact our Information Officer:
            </p>
            <div className="bg-gray-50 p-4 rounded-md text-muted-foreground">
              <p>
                <strong>NUSAF Dynamic Technologies (Pty) Ltd</strong>
              </p>
              <p>Email: privacy@nusaf.co.za</p>
              <p>Phone: +27 (0) 11 000 0000</p>
              <p>
                Address: [Company Address]
                <br />
                Johannesburg, South Africa
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Information Regulator</h2>
            <p className="text-muted-foreground mb-4">
              If you are not satisfied with our response, you may lodge a
              complaint with the Information Regulator:
            </p>
            <div className="bg-gray-50 p-4 rounded-md text-muted-foreground">
              <p>
                <strong>Information Regulator (South Africa)</strong>
              </p>
              <p>Website: www.inforegulator.org.za</p>
              <p>Email: complaints.IR@justice.gov.za</p>
            </div>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t">
          <Link href="/" className="text-primary hover:underline">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
