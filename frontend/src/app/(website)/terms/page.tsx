import { Metadata } from 'next';
import { WebsiteHeader } from '@/components/website/WebsiteHeader';
import { WebsiteFooter } from '@/components/website/WebsiteFooter';
import { Container } from '@/components/website/Container';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description:
    'Terms and Conditions for Nusaf Dynamic Technologies. Read our terms of sale and use of our services.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <WebsiteHeader />

      <main className="flex-grow">
        <section className="py-12 lg:py-16">
          <Container>
            <div className="max-w-3xl mx-auto">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Terms &amp; Conditions</h1>
              <p className="text-slate-500 mb-8">Last updated: January 2024</p>

              <div className="prose prose-slate max-w-none">
                <h2>1. Introduction</h2>
                <p>
                  These Terms and Conditions (&quot;Terms&quot;) govern your use of the Nusaf Dynamic
                  Technologies (Pty) Ltd (&quot;Nusaf&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) website and the
                  purchase of products and services from us.
                </p>
                <p>
                  By using our website or placing an order, you agree to be bound by these Terms.
                  Please read them carefully.
                </p>

                <h2>2. Definitions</h2>
                <ul>
                  <li>
                    <strong>&quot;Buyer&quot;</strong> means the person or entity purchasing products from
                    Nusaf
                  </li>
                  <li>
                    <strong>&quot;Products&quot;</strong> means the goods offered for sale by Nusaf
                  </li>
                  <li>
                    <strong>&quot;Order&quot;</strong> means a request by the Buyer to purchase Products
                  </li>
                  <li>
                    <strong>&quot;Quote&quot;</strong> means a formal price quotation issued by Nusaf
                  </li>
                </ul>

                <h2>3. Quotations and Orders</h2>
                <h3>3.1 Quotations</h3>
                <ul>
                  <li>Quotations are valid for 30 days unless otherwise stated</li>
                  <li>Prices exclude VAT unless otherwise indicated</li>
                  <li>Quotations are subject to stock availability at time of order</li>
                </ul>

                <h3>3.2 Orders</h3>
                <ul>
                  <li>Orders are only confirmed upon receipt of a purchase order or written confirmation</li>
                  <li>Nusaf reserves the right to decline any order</li>
                  <li>Once confirmed, orders cannot be cancelled without Nusaf&apos;s written consent</li>
                </ul>

                <h2>4. Prices and Payment</h2>
                <h3>4.1 Prices</h3>
                <ul>
                  <li>All prices are quoted in South African Rand (ZAR)</li>
                  <li>Prices are subject to change without notice prior to order confirmation</li>
                  <li>Import products are subject to exchange rate fluctuations</li>
                </ul>

                <h3>4.2 Payment Terms</h3>
                <ul>
                  <li>
                    New customers: 100% payment in advance or pro-forma invoice before dispatch
                  </li>
                  <li>
                    Account customers: 30 days from date of invoice (subject to credit approval)
                  </li>
                  <li>Interest of 2% per month may be charged on overdue accounts</li>
                </ul>

                <h2>5. Delivery</h2>
                <h3>5.1 Delivery Terms</h3>
                <ul>
                  <li>Delivery dates are estimates only and not guaranteed</li>
                  <li>Risk passes to the Buyer upon delivery</li>
                  <li>Standard delivery is to door, excluding offloading</li>
                </ul>

                <h3>5.2 Delivery Costs</h3>
                <ul>
                  <li>Delivery costs are quoted separately unless stated otherwise</li>
                  <li>Free delivery may apply for orders above certain thresholds</li>
                  <li>Express delivery options available at additional cost</li>
                </ul>

                <h2>6. Returns and Refunds</h2>
                <h3>6.1 Standard Returns</h3>
                <ul>
                  <li>Returns accepted within 14 days of delivery</li>
                  <li>Products must be unused, in original packaging</li>
                  <li>A restocking fee of up to 20% may apply</li>
                  <li>Custom or made-to-order items are non-returnable</li>
                </ul>

                <h3>6.2 Defective Products</h3>
                <ul>
                  <li>Report defects within 7 days of delivery</li>
                  <li>Defective products will be replaced or refunded at Nusaf&apos;s discretion</li>
                  <li>Products must be returned for inspection before replacement</li>
                </ul>

                <h2>7. Warranty</h2>
                <ul>
                  <li>Products carry the manufacturer&apos;s warranty</li>
                  <li>Warranty claims must be submitted with proof of purchase</li>
                  <li>
                    Warranty does not cover normal wear, misuse, or improper installation
                  </li>
                  <li>
                    Nusaf&apos;s liability is limited to product replacement or refund
                  </li>
                </ul>

                <h2>8. Limitation of Liability</h2>
                <ul>
                  <li>
                    Nusaf shall not be liable for indirect, consequential, or incidental damages
                  </li>
                  <li>
                    Total liability shall not exceed the purchase price of the Products
                  </li>
                  <li>
                    Nusaf is not liable for losses arising from product misuse or improper installation
                  </li>
                </ul>

                <h2>9. Intellectual Property</h2>
                <p>
                  All content on this website, including text, images, logos, and software, is the
                  property of Nusaf or its licensors and is protected by copyright and other
                  intellectual property laws.
                </p>

                <h2>10. Website Use</h2>
                <ul>
                  <li>You may use this website for lawful purposes only</li>
                  <li>You must not attempt to gain unauthorized access to our systems</li>
                  <li>Product information is for guidance only and may change without notice</li>
                </ul>

                <h2>11. Force Majeure</h2>
                <p>
                  Nusaf shall not be liable for any failure or delay in performance due to
                  circumstances beyond our reasonable control, including but not limited to natural
                  disasters, strikes, government actions, or supplier failures.
                </p>

                <h2>12. Governing Law</h2>
                <p>
                  These Terms are governed by the laws of the Republic of South Africa. Any disputes
                  shall be subject to the exclusive jurisdiction of the South African courts.
                </p>

                <h2>13. Changes to Terms</h2>
                <p>
                  Nusaf reserves the right to update these Terms at any time. Changes will be
                  effective upon posting to this website. Continued use of our services constitutes
                  acceptance of the updated Terms.
                </p>

                <h2>14. Contact Information</h2>
                <p>For questions about these Terms, please contact us:</p>
                <p>
                  <strong>Email:</strong> info@nusaf.co.za
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
