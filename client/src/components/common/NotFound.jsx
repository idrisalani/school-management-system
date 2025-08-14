import React from "react";
import { Link } from "react-router-dom";

/**
 * Not Found (404) page component.
 * @returns {React.ReactElement} Not found page component
 */
const NotFound = () => {
  return (
    <div className="text-center py-10">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="mb-4">The page you are looking for doesn`&apos;`t exist.</p>
      <Link to="/" className="text-blue-500 hover:text-blue-700">
        Return to Home
      </Link>
    </div>
  );
};

export default NotFound;
