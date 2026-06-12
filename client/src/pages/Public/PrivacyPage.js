import React from 'react';
import Button from '../../components/UI/Button';
import { Link } from 'react-router-dom';
import { ShieldCheck, Eye, Database, Share2 } from 'lucide-react';

const PrivacyPage = () => {
  return (
    <div className="bg-apple-gray-50 dark:bg-apple-gray-950 min-h-screen py-16">
      <div className="container mx-auto px-6 max-w-4xl">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-apple-gray-900 dark:text-white">
            Privacy Policy
          </h1>
          <p className="mt-3 text-apple-gray-500 dark:text-apple-gray-400">
            Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Core Content */}
        <div className="bg-white dark:bg-apple-gray-900 rounded-2xl p-8 md:p-12 shadow-sm border border-apple-gray-100 dark:border-apple-gray-800 space-y-8 text-apple-gray-700 dark:text-apple-gray-300 leading-relaxed">
          
          <section>
            <div className="flex items-center gap-3 mb-3">
              <Eye className="text-apple-blue" size={24} />
              <h2 className="text-xl font-bold text-apple-gray-900 dark:text-white">1. Information We Collect</h2>
            </div>
            <p className="mb-2"> We collect data to provide management services and coordinate directory listings effectively:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Tenant Registration Data:</strong> Names, business names, addresses, phone numbers, email addresses, and secure authentication credentials.</li>
              <li><strong>Customer Records:</strong> Laundry client names and phone numbers uploaded securely by Tenants to facilitate order management.</li>
              <li><strong>Location Data:</strong> Geolocation coordinates or IP addresses are processed to default regional settings on the public directory.</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-3">
              <Database className="text-apple-blue" size={24} />
              <h2 className="text-xl font-bold text-apple-gray-900 dark:text-white">2. How We Use Information</h2>
            </div>
            <p className="mb-2">Collected data is put to use to run services securely, including:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Authenticating login sessions and verifying directory listings.</li>
              <li>Processing pay-outs, monitoring wallet operations, and charging fee allocations (such as the standard <strong>$0.20 USD / 120 XAF</strong> per-message transaction fee).</li>
              <li>Sending transactional SMS and WhatsApp messages to laundry clients on behalf of subscribed Tenants.</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-3">
              <Share2 className="text-apple-blue" size={24} />
              <h2 className="text-xl font-bold text-apple-gray-900 dark:text-white">3. Third-Party Integrations & Data Sharing</h2>
            </div>
            <p>
              We do not sell, rent, or trade your personal information. Data sharing is limited strictly to third-party APIs working to deliver infrastructure services:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li><strong>Messaging Providers (Twilio, WhatsApp APIs):</strong> Shared contact strings and transactional order texts needed to complete system alerts.</li>
              <li><strong>Cloud Storage (Cloudinary):</strong> Hosting for tenant-uploaded directory branding and receipts.</li>
              <li><strong>Payment Gateways:</strong> Secured processing networks handling subscription collections.</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-3">
              <ShieldCheck className="text-apple-blue" size={24} />
              <h2 className="text-xl font-bold text-apple-gray-900 dark:text-white">4. Data Security & Retention</h2>
            </div>
            <p>
              We run industry-standard encryption protocols (including secure password hashing using `bcrypt.js` and JWT token exchange patterns) to keep operations safe. Data is stored on MongoDB Atlas databases and kept for as long as your account is active, or as needed to resolve audit requests and billing accounts.
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

export default PrivacyPage;