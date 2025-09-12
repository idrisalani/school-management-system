// @ts-nocheck

// client/src/components/demo/PageRoleSelector.jsx
// Clean page layout for landing page → "Live Demo" flow

import React from "react";
import { useNavigate } from "react-router-dom";
import { Shield, User, Book, Users, ArrowLeft } from "lucide-react";
import { useDemo } from "../../contexts/DemoContext";

const PageRoleSelector = () => {
  const navigate = useNavigate();
  const { enterDemoMode, availableRoles } = useDemo();

  const roleConfig = {
    admin: {
      icon: Shield,
      title: "School Administrator",
      subtitle: "Admin",
      description:
        "Manage the entire school system with comprehensive analytics and controls",
      features: [
        "School-wide analytics",
        "User management",
        "Financial reporting",
        "System settings",
      ],
      colors: {
        primary: "bg-purple-600",
        light: "bg-purple-50",
        border: "border-purple-200",
        text: "text-purple-600",
        hover: "hover:bg-purple-700",
        shadow: "hover:shadow-purple-100",
      },
    },
    teacher: {
      icon: User,
      title: "Teacher",
      subtitle: "Teacher",
      description:
        "Manage classes, create assignments, and track student progress",
      features: [
        "Assignment creation",
        "Grade management",
        "Class analytics",
        "Student progress",
      ],
      colors: {
        primary: "bg-green-600",
        light: "bg-green-50",
        border: "border-green-200",
        text: "text-green-600",
        hover: "hover:bg-green-700",
        shadow: "hover:shadow-green-100",
      },
    },
    student: {
      icon: Book,
      title: "Student",
      subtitle: "Student",
      description:
        "View assignments, check grades, and track academic progress",
      features: [
        "Assignment submissions",
        "Grade tracking",
        "Attendance view",
        "Academic progress",
      ],
      colors: {
        primary: "bg-blue-600",
        light: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-600",
        hover: "hover:bg-blue-700",
        shadow: "hover:shadow-blue-100",
      },
    },
    parent: {
      icon: Users,
      title: "Parent",
      subtitle: "Parent",
      description:
        "Monitor your children's academic progress and school activities",
      features: [
        "Children overview",
        "Grade monitoring",
        "Attendance tracking",
        "Communication",
      ],
      colors: {
        primary: "bg-orange-600",
        light: "bg-orange-50",
        border: "border-orange-200",
        text: "text-orange-600",
        hover: "hover:bg-orange-700",
        shadow: "hover:shadow-orange-100",
      },
    },
  };

  const handleRoleSelect = (role) => {
    enterDemoMode(role);
  };

  const handleBackToHome = () => {
    // Clear any demo state and go home
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("demo_mode");
      sessionStorage.removeItem("demo_role");
      sessionStorage.removeItem("demo_user");
    }
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navigation Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={handleBackToHome}
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Experience EduManager
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Choose a role to explore our School Management System with realistic
            sample data. All interactions are simulated and completely safe to
            explore.
          </p>
        </div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {availableRoles.map((role) => {
            const config = roleConfig[role];
            const Icon = config.icon;

            return (
              <div
                key={role}
                className={`bg-white rounded-2xl border-2 ${config.colors.border} p-8 transition-all duration-300 hover:shadow-2xl ${config.colors.shadow} transform hover:-translate-y-2 cursor-pointer group`}
                onClick={() => handleRoleSelect(role)}
              >
                {/* Header */}
                <div className="flex items-start space-x-6 mb-6">
                  <div
                    className={`w-16 h-16 rounded-xl ${config.colors.light} flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon className={`h-8 w-8 ${config.colors.text}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {config.title}
                    </h3>
                    <span
                      className={`inline-block px-4 py-1 rounded-full text-sm font-medium ${config.colors.light} ${config.colors.text}`}
                    >
                      {config.subtitle}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-700 text-lg mb-6 leading-relaxed">
                  {config.description}
                </p>

                {/* Features */}
                <div className="mb-8">
                  <h4 className="text-sm font-semibold text-gray-800 mb-4 uppercase tracking-wide">
                    Key Features
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {config.features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center text-gray-600"
                      >
                        <div className="w-2 h-2 bg-gray-400 rounded-full mr-3 flex-shrink-0"></div>
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRoleSelect(role);
                  }}
                  className={`w-full py-4 px-6 rounded-xl text-white font-semibold text-lg transition-all duration-200 ${config.colors.primary} ${config.colors.hover} shadow-lg hover:shadow-xl transform group-hover:scale-105`}
                >
                  Try {config.title} Demo
                </button>
              </div>
            );
          })}
        </div>

        {/* Bottom Info Section */}
        <div className="text-center">
          <div className="bg-white rounded-xl p-8 shadow-md border border-gray-100 max-w-4xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Safe Demo Environment
            </h3>
            <p className="text-gray-600 leading-relaxed">
              This demo uses completely simulated data. You can explore all
              features, create assignments, process payments, and manage users
              without affecting any real information. Perfect for testing the
              system before making decisions.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-gray-500">
              <span className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                No real data affected
              </span>
              <span className="flex items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                Full feature access
              </span>
              <span className="flex items-center">
                <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
                Switch roles anytime
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageRoleSelector;
