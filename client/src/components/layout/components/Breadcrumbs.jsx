// @ts-nocheck

// client/src/layout/components/Breadcrumbs.jsx
import React from "react";
import { Link, useLocation, useMatches } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const Breadcrumbs = () => {
  const location = useLocation();
  const matches = useMatches();

  // Map of route paths to human-readable names
  const routeLabels = {
    dashboard: "Dashboard",
    students: "Students",
    teachers: "Teachers",
    classes: "Classes",
    attendance: "Attendance",
    assignments: "Assignments",
    grades: "Grades",
    settings: "Settings",
    profile: "Profile",
    "student-details": "Student Details",
    "create-student": "Add New Student",
    "edit-student": "Edit Student",
    reports: "Reports",
    analytics: "Analytics",
  };

  // Get breadcrumb items from current route matches
  const breadcrumbs = matches
    // Filter out routes that shouldn't show in breadcrumbs
    .filter((match) => {
      const routePath = match.pathname.split("/").pop();
      return routePath !== "" && !match.pathname.includes("index");
    })
    // Map routes to breadcrumb items
    .map((match) => {
      const routePath = match.pathname.split("/").pop();
      const label = routeLabels[routePath] || routePath.replace(/-/g, " ");

      return {
        path: match.pathname,
        label: label.charAt(0).toUpperCase() + label.slice(1),
        // Check if it's the current page
        current: location.pathname === match.pathname,
      };
    });

  // Don't render if we're on the home page or have no breadcrumbs
  if (location.pathname === "/" || breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="w-full">
      <ol className="flex items-center space-x-2 text-sm">
        {/* Home Link */}
        <li>
          <Link
            to="/"
            className="text-gray-500 hover:text-blue-600 flex items-center"
          >
            <Home className="h-4 w-4" />
            <span className="sr-only">Home</span>
          </Link>
        </li>

        {/* Separator after home */}
        <li className="text-gray-400">
          <ChevronRight className="h-4 w-4" />
        </li>

        {/* Breadcrumb items */}
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={breadcrumb.path} className="flex items-center">
            {/* Breadcrumb link or text */}
            {breadcrumb.current ? (
              <span className="text-gray-900 font-medium" aria-current="page">
                {breadcrumb.label}
              </span>
            ) : (
              <>
                <Link
                  to={breadcrumb.path}
                  className="text-gray-500 hover:text-blue-600"
                >
                  {breadcrumb.label}
                </Link>
                {/* Separator between items */}
                {index < breadcrumbs.length - 1 && (
                  <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
                )}
              </>
            )}
          </li>
        ))}
      </ol>

      {/* Mobile breadcrumb - simplified version */}
      <div className="sm:hidden mt-2">
        <div className="flex items-center text-sm text-gray-500">
          <ChevronRight className="h-4 w-4 mr-1" />
          <span className="font-medium text-gray-900">
            {breadcrumbs[breadcrumbs.length - 1]?.label}
          </span>
        </div>
      </div>
    </nav>
  );
};

export default Breadcrumbs;
