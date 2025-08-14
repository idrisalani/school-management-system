// @ts-nocheck
import React from "react";
import { Outlet, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PropTypes from "prop-types";

/**
 * Focus layout component for full-screen pages like login and register.
 * Provides a minimal interface with a back button and centered content.
 * @param {object} props - Component props
 * @param {React.ReactNode} [props.children] - Optional child components to render instead of Outlet
 * @returns {React.ReactElement} Focus layout component
 */
const FocusLayout = ({ children }) => {
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
        <div className="py-8">{children || <Outlet />}</div>
      </main>
    </div>
  );
};

FocusLayout.propTypes = {
  children: PropTypes.node,
};

export default FocusLayout;
