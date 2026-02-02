import { Metadata } from 'next';
import { WebsiteHeader } from '@/components/website/WebsiteHeader';
import { WebsiteFooter } from '@/components/website/WebsiteFooter';
import { Container } from '@/components/website/Container';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Privacy Policy for Nusaf Dynamic Technologies. Learn how we collect, use, and protect your personal information.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <WebsiteHeader />

      <main className="flex-grow">
        <section className="py-12 lg:py-16">
          <Container>
            <div className="max-w-3xl mx-auto">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
              <p className="text-slate-500 mb-8">Last updated: January 2024</p>

              <div className="prose prose-slate max-w-none">
                <h2>1. Introduction</h2>
                <p>
                  Nusaf Dynamic Technologies (Pty) Ltd (&quot;Nusaf&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is
                  committed to protecting your personal information in accordance with the Protection
                  of Personal Information Act 4 of 2013 (&quot;POPIA&quot;) and other applicable South African
                  privacy laws.
                </p>
                <p>
                  This Privacy Policy explains how we collect, use, disclose, and safeguard your
                  information when you visit our website or use our services.
                </p>

                <h2>2. Information We Collect</h2>
                <h3>2.1 Personal Information</h3>
                <p>We may collect the following personal information:</p>
                <ul>
                  <li>Name and surname</li>
                  <li>Company name and position</li>
                  <li>Email address</li>
                  <li>Phone number</li>
                  <li>Physical address</li>
                  <li>VAT number (for business customers)</li>
                </ul>

                <h3>2.2 Automatically Collected Information</h3>
                <p>When you visit our website, we may automatically collect:</p>
                <ul>
                  <li>IP address</li>
                  <li>Browser type and version</li>
                  <li>Pages visited and time spent</li>
                  <li>Referring website</li>
                  <li>Device information</li>
                </ul>

                <h2>3. How We Use Your Information</h2>
                <p>We use your personal information to:</p>
                <ul>
                  <li>Process and fulfil your orders</li>
                  <li>Respond to your enquiries and provide customer support</li>
                  <li>Send quotes and invoices</li>
                  <li>Communicate about products, services, and promotions</li>
                  <li>Improve our website and services</li>
                  <li>Comply with legal obligations</li>
                </ul>

                <h2>4. Legal Basis for Processing</h2>
                <p>We process your personal information on the following legal bases:</p>
                <ul>
                  <li>
                    <strong>Contract:</strong> Processing necessary to perform our contract with you
                  </li>
                  <li>
                    <strong>Consent:</strong> Where you have given consent for specific purposes
                  </li>
                  <li>
                    <strong>Legitimate Interest:</strong> To improve our services and communicate with
                    customers
                  </li>
                  <li>
                    <strong>Legal Obligation:</strong> To comply with applicable laws and regulations
                  </li>
                </ul>

                <h2>5. Information Sharing</h2>
                <p>We may share your information with:</p>
                <ul>
                  <li>Our suppliers and logistics partners to fulfil orders</li>
                  <li>Payment processors to handle transactions</li>
                  <li>Professional advisors (lawyers, accountants)</li>
                  <li>Government authorities when required by law</li>
                </ul>
                <p>We do not sell your personal information to third parties.</p>

                <h2>6. Data Security</h2>
                <p>
                  We implement appropriate technical and organisational measures to protect your
                  personal information against unauthorized access, alteration, disclosure, or
                  destruction. These measures include:
                </p>
                <ul>
                  <li>Encryption of data in transit and at rest</li>
                  <li>Secure access controls</li>
                  <li>Regular security assessments</li>
                  <li>Employee training on data protection</li>
                </ul>

                <h2>7. Data Retention</h2>
                <p>
                  We retain your personal information for as long as necessary to fulfil the purposes
                  for which it was collected, or as required by law. Typical retention periods
                  include:
                </p>
                <ul>
                  <li>Customer records: 7 years after last transaction</li>
                  <li>Quote requests: 2 years</li>
                  <li>Marketing preferences: Until you unsubscribe</li>
                </ul>

                <h2>8. Your Rights</h2>
                <p>Under POPIA, you have the right to:</p>
                <ul>
                  <li>Request access to your personal information</li>
                  <li>Request correction of inaccurate information</li>
                  <li>Request deletion of your information (subject to legal requirements)</li>
                  <li>Object to processing of your information</li>
                  <li>Withdraw consent where processing is based on consent</li>
                  <li>Lodge a complaint with the Information Regulator</li>
                </ul>

                <h2>9. Cookies</h2>
                <p>
                  Our website uses cookies to enhance your browsing experience. You can control
                  cookie settings through your browser preferences. For more information, see our
                  Cookie Policy.
                </p>

                <h2>10. Changes to This Policy</h2>
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of any
                  changes by posting the new Privacy Policy on this page and updating the &quot;Last
                  updated&quot; date.
                </p>

                <h2>11. Contact Us</h2>
                <p>
                  If you have questions about this Privacy Policy or wish to exercise your rights,
                  please contact our Information Officer:
                </p>
                <p>
                  <strong>Email:</strong> privacy@nusaf.co.za
                  <br />
                  <strong>Phone:</strong> +27 11 592 1962
                  <br />
                  <strong>Address:</strong> Unit 5, Tunney Industrial Park, 102 Harry Galaun Drive,
                  Tunney, 1460
                </p>
              </div>
            </div>
          </Container>
        </section>
      </main>

      <WebsiteFooter />
    </div>
  );
}
