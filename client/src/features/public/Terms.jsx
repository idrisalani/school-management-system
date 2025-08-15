// @ts-nocheck

// src/features/public/Terms.jsx
import React from "react";
import { Link } from "react-router-dom";
import { GraduationCap, ArrowLeft, FileText } from "lucide-react";

const Terms = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center">
              <GraduationCap className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                EduManager
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <FileText className="h-12 w-12 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Terms of Service
          </h1>
          <p className="text-lg text-gray-600">
            Please read these terms carefully before using our service.
          </p>
          <div className="mt-4 text-sm text-gray-500">
            Last updated: August 15, 2025
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
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
                <li>Respect the intellectual property rights of others</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                3. Service Usage
              </h2>
              <p className="text-gray-600 mb-4">
                EduManager is provided &quot;as is&quot; and &quot;as
                available.&quot; We may modify, suspend, or discontinue any part
                of the service at any time. We reserve the right to limit or
                terminate accounts that violate our terms.
              </p>
              <p className="text-gray-600">
                You are responsible for maintaining the confidentiality of your
                account credentials and for all activities that occur under your
                account.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                4. Data Usage and Privacy
              </h2>
              <p className="text-gray-600">
                We handle all data in accordance with our Privacy Policy. You
                retain ownership of your data, and grant us the necessary rights
                to provide our services. We are committed to protecting your
                privacy and will never sell your personal information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                5. Limitation of Liability
              </h2>
              <p className="text-gray-600">
                EduManager shall not be liable for any indirect, incidental,
                special, consequential, or punitive damages resulting from your
                use of the service. Our total liability shall not exceed the
                amount paid by you for the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                6. Contact Information
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

        {/* Footer Navigation */}
        <div className="mt-12 flex justify-between items-center">
          <Link
            to="/"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Homepage
          </Link>
          <div className="flex space-x-6 text-sm">
            <Link to="/privacy" className="text-gray-600 hover:text-gray-900">
              Privacy Policy
            </Link>
            <Link to="/contact" className="text-gray-600 hover:text-gray-900">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
