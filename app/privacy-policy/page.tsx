import { Navigation } from "@/components/landing/navigation";
import { FooterSection } from "@/components/landing/footer-section";

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navigation />
      <main className="relative min-h-screen overflow-x-hidden bg-black pt-24">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-8">
            Privacy Policy
          </h1>
          <p className="text-gray-400 mb-12">
            Last updated: March 16, 2026
          </p>

          <div className="prose prose-invert max-w-none">
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Vant ("we," "our," or "us") operates the Vant prediction and wagering platform. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your 
                information when you use our services, including our website, mobile application, 
                and related services (collectively, the "Service").
              </p>
              <p className="text-gray-300 leading-relaxed">
                We are committed to protecting your privacy and ensuring the security of your 
                personal information. By accessing or using Vant, you agree to the terms of 
                this Privacy Policy.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-white mt-6 mb-3">2.1 Personal Information</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                When you register for or use our Service, we may collect the following personal 
                information:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>Email address</li>
                <li>Wallet addresses (Solana, Base)</li>
                <li>Transaction history and betting activity</li>
                <li>Device information and IP address</li>
                <li>Usage data and interaction patterns</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">2.2 Blockchain Information</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                As a blockchain-based platform, we collect and process on-chain data including:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>Public wallet addresses</li>
                <li>Smart contract interactions</li>
                <li>Transaction hashes and timestamps</li>
                <li>Wager outcomes and settlement records</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">2.3 Automatically Collected Information</h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                We automatically collect certain information when you access the Service:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>Device type and operating system</li>
                <li>Browser type and version</li>
                <li>Referral source and pages visited</li>
                <li>Time and duration of visits</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>Provide, maintain, and improve the Vant Service</li>
                <li>Process transactions and manage wagers</li>
                <li>Display balances in NGN through our Naira-first abstraction layer</li>
                <li>Send technical notices and support messages</li>
                <li>Respond to your comments, questions, and requests</li>
                <li>Monitor and analyze trends, usage, and activities</li>
                <li>Detect, investigate, and prevent fraudulent transactions</li>
                <li>Comply with legal and regulatory requirements</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-4">4. Information Sharing and Disclosure</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We do not sell, trade, or otherwise transfer your personal information to third 
                parties except in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>
                  <strong>Service Providers:</strong> We share information with trusted third-party 
                  providers who assist in operating our Service (e.g., Kalshi for prediction data, 
                  Coinbase for price feeds, blockchain infrastructure providers).
                </li>
                <li>
                  <strong>Legal Requirements:</strong> We may disclose information if required by 
                  law, regulation, legal process, or governmental request.
                </li>
                <li>
                  <strong>Business Transfers:</strong> In connection with a merger, acquisition, 
                  or sale of assets, your information may be transferred as part of the transaction.
                </li>
                <li>
                  <strong>Protection of Rights:</strong> We may disclose information to protect 
                  the rights, property, or safety of Vant, our users, or others.
                </li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-4">5. Blockchain and Public Information</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Please note that blockchain transactions are inherently public and immutable. 
                Information recorded on the Solana or Base blockchains, including wallet 
                addresses and transaction details, cannot be deleted or modified. This data 
                is visible to anyone and is not controlled by Vant.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-4">6. Data Security</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We implement appropriate technical and organizational measures to protect your 
                personal information, including:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security audits and assessments</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Monitoring for unauthorized access and anomalies</li>
              </ul>
              <p className="text-gray-300 leading-relaxed mt-4">
                However, no method of transmission over the internet or electronic storage is 
                100% secure. While we strive to protect your information, we cannot guarantee 
                absolute security.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-4">7. Your Rights and Choices</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Depending on your location, you may have the following rights:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>Access to your personal information</li>
                <li>Correction of inaccurate information</li>
                <li>Deletion of your personal information (subject to blockchain immutability)</li>
                <li>Opt-out of marketing communications</li>
                <li>Data portability</li>
              </ul>
              <p className="text-gray-300 leading-relaxed mt-4">
                To exercise these rights, please contact us at{" "}
                <a href="mailto:me@davidnzube.xyz" className="text-red-500 hover:underline">
                  me@davidnzube.xyz
                </a>.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-4">8. International Data Transfers</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Vant operates globally, and your information may be transferred to and processed 
                in countries other than your own. We ensure appropriate safeguards are in place 
                to protect your information in accordance with this Privacy Policy.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-4">9. Children's Privacy</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                The Vant Service is not intended for individuals under the age of 18. We do not 
                knowingly collect personal information from children. If we become aware that we 
                have collected information from a child, we will take steps to delete it.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-4">10. Changes to This Privacy Policy</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any 
                changes by posting the new policy on this page and updating the "Last updated" 
                date. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-4">11. Contact Us</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                If you have any questions about this Privacy Policy, please contact us:
              </p>
              <ul className="list-none text-gray-300 space-y-2">
                <li>Email:{" "}
                  <a href="mailto:me@davidnzube.xyz" className="text-red-500 hover:underline">
                    me@davidnzube.xyz
                  </a>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </main>
      <FooterSection />
    </>
  );
}
