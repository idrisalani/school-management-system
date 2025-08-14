// src/features/public/Privacy.jsx
import React from "react";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Privacy Policy
        </h1>

        <div className="prose prose-indigo max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              1. Information Collection
            </h2>
            <p className="text-gray-600 mb-4">
              We collect information that you provide directly to us when using
              our services:
            </p>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
              <li>Account and profile information</li>
              <li>Educational institution details</li>
              <li>Student and staff records</li>
              <li>Usage data and analytics</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              2. Data Usage
            </h2>
            <p className="text-gray-600 mb-4">
              We use collected information to:
            </p>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
              <li>Provide and improve our services</li>
              <li>Send important notifications</li>
              <li>Generate analytics and reports</li>
              <li>Maintain service security</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              3. Data Protection
            </h2>
            <p className="text-gray-600">
              We implement industry-standard security measures to protect your
              data. This includes encryption, secure data storage, and regular
              security audits.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              4. Contact
            </h2>
            <p className="text-gray-600">
              For privacy-related inquiries, please contact us at{" "}
              <a
                href="mailto:privacy@edumanager.com"
                className="text-indigo-600 hover:text-indigo-800"
              >
                privacy@edumanager.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
