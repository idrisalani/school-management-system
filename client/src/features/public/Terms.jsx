// src/features/public/Terms.jsx
import React from "react";

const Terms = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Terms of Service
        </h1>

        <div className="prose prose-indigo max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-gray-600">
              By accessing or using EduManager, you agree to these Terms of
              Service and our Privacy Policy. If you disagree with any part of
              these terms, please do not use our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              2. User Responsibilities
            </h2>
            <p className="text-gray-600 mb-4">
              As a user of EduManager, you agree to:
            </p>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account</li>
              <li>Use the service in compliance with applicable laws</li>
              <li>Not misuse or attempt to compromise our systems</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              3. Service Usage
            </h2>
            <p className="text-gray-600">
              EduManager is provided &quot;as is&quot; and &quot;as
              available.&quot; We may modify, suspend, or discontinue any part
              of the service at any time. We reserve the right to limit or
              terminate accounts that violate our terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              4. Data Usage
            </h2>
            <p className="text-gray-600">
              We handle all data in accordance with our Privacy Policy. You
              retain ownership of your data, and grant us the necessary rights
              to provide our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              5. Contact
            </h2>
            <p className="text-gray-600">
              For questions about these terms, please contact{" "}
              <a
                href="mailto:legal@edumanager.com"
                className="text-indigo-600 hover:text-indigo-800"
              >
                legal@edumanager.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;
