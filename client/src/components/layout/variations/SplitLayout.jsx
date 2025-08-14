// @ts-nocheck

// client/src/layout/variations/FocusLayout.jsx
import React from "react";
import { Outlet, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const FocusLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Minimal header with back button */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <Link
              to="/"
              className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
              <span>Back</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default FocusLayout;
