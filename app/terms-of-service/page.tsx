import { Metadata } from 'next'
import { Navigation } from "@/components/landing/navigation";
import { FooterSection } from "@/components/landing/footer-section";

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for Vantic - Read our terms and conditions for using the prediction and wagering platform.',
  robots: {
    index: true,
    follow: true,
  },
}

export default function TermsOfServicePage() {
  return (
    <>
      <Navigation />
      <main className="relative min-h-screen overflow-x-hidden bg-black pt-24">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-8">
            Terms of Service
          </h1>
          <p className="text-gray-400 mb-12">
            Last updated: March 16, 2026
          </p>

          <div className="prose prose-invert max-w-none">
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-4">1. Agreement to Terms</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                By accessing or using Vantic (the "Service"), you agree to be bound by these
                Terms of Service ("Terms"). If you do not agree to these Terms, do not access
                or use the Service.
              </p>
              <p className="text-gray-300 leading-relaxed">
                These Terms constitute a legally binding agreement between you and Vantic.
                We reserve the right to modify these Terms at any time. Your continued use
                of the Service after changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-4">2. Description of Service</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Vantic is a prediction and wagering platform built on blockchain technology,
                offering the following services:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>
                  <strong>Vantic Crypto:</strong> Minute-interval price predictions for BTC,
                  ETH, and SOL using real-time data from Coinbase and Kalshi.
                </li>
                <li>
                  <strong>Vantic Sports:</strong> Sports-based outcome predictions on global events.
                </li>
                <li>
                  <strong>Vantic VS:</strong> A peer-to-peer wagering protocol allowing users
                  to create custom wagers on any event with decentralized escrow protection.
                </li>
              </ul>
              <p className="text-gray-300 leading-relaxed mt-4">
                The Service displays all balances in USD, regardless of the underlying cryptocurrency
                (SOL, USDC, USDT) used for transactions.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-4">3. Eligibility</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                To use the Vantic Service, you must:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>Be at least 18 years of age</li>
                <li>Have the legal capacity to enter into binding contracts</li>
                <li>Not be prohibited from using the Service under applicable law</li>
                <li>Not be located in a jurisdiction where prediction markets or wagering are prohibited</li>
              </ul>
              <p className="text-gray-300 leading-relaxed mt-4">
                By using the Service, you represent and warrant that you meet all eligibility
                requirements.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-4">4. Account and Wallet</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                To use certain features of the Service, you must connect a compatible 
                cryptocurrency wallet (Solana or Base). You are responsible for:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>Maintaining the security of your wallet and private keys</li>
                <li>All transactions made from your wallet</li>
                <li>Ensuring your wallet has sufficient funds for transactions</li>
              </ul>
              <p className="text-gray-300 leading-relaxed mt-4">
                Vantic does not have access to your private keys and cannot recover lost or
                stolen wallets. You are solely responsible for your wallet security.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-4">5. Deposits and Withdrawals</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                The Service supports deposits and withdrawals in the following formats:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>Cryptocurrencies: SOL, USDC, USDT (on Solana and Base networks)</li>
              </ul>
              <p className="text-gray-300 leading-relaxed mt-4">
                All balances are displayed in USD for user convenience. Withdrawals can be
                made to any compatible cryptocurrency wallet. Processing times and fees may apply.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-4">6. Prediction Markets and Wagering</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                <strong>6.1 Nature of Predictions:</strong> Vantic Crypto and Vantic Sports involve
                predicting outcomes of future events. These are not investments or financial
                instruments. Past performance does not guarantee future results.
              </p>
              <p className="text-gray-300 leading-relaxed mb-4">
                <strong>6.2 Vantic VS (Peer-to-Peer Wagering):</strong> Users may create custom
                wagers on any event. Both parties must agree to terms before funds are locked
                in escrow. Settlement occurs based on:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>Mutual agreement between parties</li>
                <li>Consensus-based dispute resolution</li>
                <li>Predefined settlement conditions</li>
              </ul>
              <p className="text-gray-300 leading-relaxed mt-4">
                <strong>6.3 Fees:</strong> Vantic charges fees on certain transactions. Fee
                structures are displayed before you confirm any transaction.
              </p>
              <p className="text-gray-300 leading-relaxed mt-4">
                <strong>6.4 Finality:</strong> All wagers settled on-chain are final and
                cannot be reversed.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-4">7. Risk Disclosure</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                <strong>YOU ACKNOWLEDGE AND AGREE THAT USING THE SERVICE INVOLVES SIGNIFICANT 
                RISKS, INCLUDING:</strong>
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>
                  <strong>Loss of Funds:</strong> You may lose some or all of your deposited 
                  funds through unsuccessful predictions or wagers.
                </li>
                <li>
                  <strong>Blockchain Risks:</strong> Smart contracts, while audited, may 
                  contain vulnerabilities. Blockchain networks may experience congestion, 
                  forks, or other technical issues.
                </li>
                <li>
                  <strong>Market Volatility:</strong> Cryptocurrency values can fluctuate
                  significantly, affecting the USD value of your holdings.
                </li>
                <li>
                  <strong>Regulatory Uncertainty:</strong> Laws governing prediction markets 
                  and wagering vary by jurisdiction and may change.
                </li>
                <li>
                  <strong>Technical Failures:</strong> The Service may experience interruptions, 
                  delays, or errors.
                </li>
              </ul>
              <p className="text-gray-300 leading-relaxed mt-4 font-semibold">
                YOU ASSUME ALL RISKS ASSOCIATED WITH USING THE SERVICE. VANTIC DOES NOT GUARANTEE
                PROFITS OR PROTECT AGAINST LOSSES.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-4">8. Prohibited Conduct</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                You agree not to:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>Use the Service for any illegal purpose</li>
                <li>Manipulate prediction markets or wagering outcomes</li>
                <li>Engage in fraudulent, deceptive, or misleading conduct</li>
                <li>Use bots, scripts, or automated systems to exploit the Service</li>
                <li>Attempt to gain unauthorized access to Vantic's systems</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Use the Service if you are located in a prohibited jurisdiction</li>
                <li>Transfer or attempt to transfer your account to another party</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-4">9. Intellectual Property</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                All content, features, and functionality of the Vantic Service, including but
                not limited to text, graphics, logos, code, and design, are owned by Vantic
                and protected by intellectual property laws. You are granted a limited,
                non-exclusive, non-transferable license to use the Service for personal,
                non-commercial purposes.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-4">10. Disclaimer of Warranties</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY
                KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED
                WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
                NON-INFRINGEMENT.
              </p>
              <p className="text-gray-300 leading-relaxed">
                VANTIC DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR
                ERROR-FREE.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-4">11. Limitation of Liability</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, VANTIC SHALL NOT BE LIABLE FOR ANY
                INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING
                BUT NOT LIMITED TO:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>Loss of profits, data, or funds</li>
                <li>Personal injury or property damage</li>
                <li>Errors, bugs, or security breaches</li>
                <li>Actions or omissions of third parties</li>
              </ul>
              <p className="text-gray-300 leading-relaxed mt-4">
                OUR TOTAL LIABILITY TO YOU FOR ANY CLAIM SHALL NOT EXCEED THE AMOUNT YOU
                PAID TO VANTIC IN THE SIX MONTHS PRECEDING THE CLAIM.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-4">12. Indemnification</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                You agree to indemnify, defend, and hold harmless Vantic and its officers,
                directors, employees, and agents from any claims, liabilities, damages,
                losses, or expenses arising out of your use of the Service, violation of
                these Terms, or infringement of any rights of another party.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-4">13. Termination</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We may suspend or terminate your access to the Service at our sole discretion, 
                with or without cause, with or without notice. Upon termination, your right 
                to use the Service will immediately cease. Provisions of these Terms that 
                by their nature should survive termination shall survive.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-4">14. Governing Law</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                These Terms shall be governed by and construed in accordance with applicable
                international laws. Any disputes arising from these Terms shall be resolved
                through binding arbitration.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-4">15. Changes to the Service</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We reserve the right to modify, suspend, or discontinue any part of the 
                Service at any time without notice. We shall not be liable to you or any 
                third party for any modification, suspension, or discontinuance of the Service.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-4">16. Contact Information</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                For questions about these Terms of Service, please contact us:
              </p>
              <ul className="list-none text-gray-300 space-y-2">
                <li>Email:{" "}
                  <a href="mailto:me@davidnzube.xyz" className="text-red-500 hover:underline">
                    me@davidnzube.xyz
                  </a>
                </li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-4">17. Acknowledgment</h2>
              <p className="text-gray-300 leading-relaxed">
                BY USING THE VANTIC SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD,
                AND AGREE TO BE BOUND BY THESE TERMS OF SERVICE.
              </p>
            </section>
          </div>
        </div>
      </main>
      <FooterSection />
    </>
  );
}
