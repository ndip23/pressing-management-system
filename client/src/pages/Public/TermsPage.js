import React from 'react';
import Button from '../../components/UI/Button';
import { Link } from 'react-router-dom';
import {  Scale, CreditCard, MessageSquare } from 'lucide-react';

const TermsPage = () => {

  return (
    <div className="bg-apple-gray-50 dark:bg-apple-gray-950 min-h-screen py-16">
      <div className="container mx-auto px-6 max-w-4xl">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-apple-gray-900 dark:text-white">
            Terms of Service
          </h1>
          <p className="mt-3 text-apple-gray-500 dark:text-apple-gray-400">
            Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Core Content */}
        <div className="bg-white dark:bg-apple-gray-900 rounded-2xl p-8 md:p-12 shadow-sm border border-apple-gray-100 dark:border-apple-gray-800 space-y-8 text-apple-gray-700 dark:text-apple-gray-300 leading-relaxed">
          
          <section>
            <div className="flex items-center gap-3 mb-3">
              <Scale className="text-apple-blue" size={24} />
              <h2 className="text-xl font-bold text-apple-gray-900 dark:text-white">1. Acceptance of Terms</h2>
            </div>
            <p>
              By creating an account, subscribing as a laundry business ("Tenant"), or browsing the PressMark public directory, you agree to comply with and be bound by these Terms of Service. If you do not agree, please do not access or use our platform.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-3">
              <CreditCard className="text-apple-blue" size={24} />
              <h2 className="text-xl font-bold text-apple-gray-900 dark:text-white">2. Subscription and Billing</h2>
            </div>
            <p>
              Tenants agree to pay all subscription fees associated with their selected plan (e.g., Basic, Premium). Subscriptions are billed on a recurring cycle. Failure to maintain an active subscription or settle outstanding balances will result in account restriction, directory delisting, or redirection to the subscription resolution portal.
            </p>
          </section>

          {/* Highlighted Message Notification / Wallet terms */}
          <section className="bg-apple-blue/5 dark:bg-apple-blue/10 p-6 rounded-xl border border-apple-blue/20">
            <div className="flex items-center gap-3 mb-3">
              <MessageSquare className="text-apple-blue" size={24} />
              <h2 className="text-xl font-bold text-apple-gray-900 dark:text-white">3. Notifications & Wallet Balance Deductions</h2>
            </div>
            <p className="mb-3">
              PressMark offers automated messaging channels (including SMS and WhatsApp integrations) to notify customers of order updates (e.g., "Pending", "Ready for Pickup").
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>
                <strong>Transaction Fee:</strong> A flat service charge of <strong>$0.50 USD</strong> (or local currency equivalent of approximately <strong>300 XAF</strong>) is deducted directly from the Tenant's digital wallet balance for each successfully queued message transaction.
              </li>
              <li>
                <strong>Wallet Funding:</strong> Tenants must maintain a sufficient prepayment balance in their dynamic wallet to use these automatic notification features.
              </li>
              <li>
                <strong>Non-Refundability:</strong> Deductions for successfully executed message requests are final and non-refundable.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-apple-gray-900 dark:text-white mb-3">4. Directory Listings and Conduct</h2>
            <p>
              Tenants are solely responsible for the accuracy of their directory profile details, prices, contact records, and fulfillments. Platform administrators reserve the unilateral right to suspend, edit, or remove listings that present inaccurate information, engage in fraudulent schemes, or fail verification procedures.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-apple-gray-900 dark:text-white mb-3">5. Limitation of Liability</h2>
            <p>
              PressMark functions as a software provider and business directory pipeline. We do not participate in, nor assume responsibility for, standard business transactions, lost garments, quality disputes, or service failures arising between directory end-users and listed business tenants.
            </p>
          </section>

        </div>

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link to="/">
            <Button variant="secondary">Back to Directory</Button>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default TermsPage;