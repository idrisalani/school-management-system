// client/src/components/common/LoadingSpinner.jsx - Enhanced with Demo Messaging & Backward Compatibility
import React from "react";
import { useDemo } from "../../contexts/DemoContext";

/**
 * Enhanced LoadingSpinner with demo awareness and flexible styling
 * @param {Object} props - Component props
 * @param {string} [props.message] - Custom loading message
 * @param {'tailwind'|'css'} [props.variant='tailwind'] - Styling variant to use
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.showDemoBadge=true] - Whether to show demo badge in demo mode
 */
const LoadingSpinner = ({
  message,
  variant = "tailwind",
  className = "",
  showDemoBadge = true,
}) => {
  const { isDemoMode } = useDemo();

  // Determine the display message
  const getDisplayMessage = () => {
    if (message) return message;
    return isDemoMode ? "Loading demo data..." : "Loading...";
  };

  // CSS/Classic variant (for backward compatibility)
  if (variant === "css") {
    return (
      <div className={`app-loading ${className}`}>
        <div className="app-loading__spinner"></div>
        {message && (
          <span className="app-loading__message">{getDisplayMessage()}</span>
        )}
        {isDemoMode && showDemoBadge && (
          <span className="app-loading__demo-badge">Demo</span>
        )}
      </div>
    );
  }

  // Default Tailwind variant (enhanced version)
  return (
    <div className={`flex items-center justify-center py-8 ${className}`}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-2 text-gray-600">
        {getDisplayMessage()}
        {isDemoMode && showDemoBadge && (
          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
            Demo
          </span>
        )}
      </span>
    </div>
  );
};

// Support both named and default exports for maximum compatibility
export { LoadingSpinner };
export default LoadingSpinner;
