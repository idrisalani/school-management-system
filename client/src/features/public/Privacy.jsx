// @ts-nocheck

// src/features/public/Privacy.jsx
import React from "react";
import { Link } from "react-router-dom";
import { GraduationCap, ArrowLeft, Shield } from "lucide-react";

const Privacy = () => {
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
            <Shield className="h-12 w-12 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-gray-600">
            Your privacy is important to us. Learn how we protect and handle
            your data.
          </p>
          <div className="mt-4 text-sm text-gray-500">
            Last updated: August 15, 2025
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="prose prose-indigo max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                1. Information Collection
              </h2>
              <p className="text-gray-600 mb-4">
                We collect information that you provide directly to us when
                using our services:
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
                security audits. Your data is never sold to third parties.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                4. Your Rights
              </h2>
              <p className="text-gray-600 mb-4">You have the right to:</p>
              <ul className="list-disc pl-5 text-gray-600 space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your data</li>
                <li>Export your data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                5. Contact Us
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
            <Link to="/terms" className="text-gray-600 hover:text-gray-900">
              Terms of Service
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

export default Privacy;
