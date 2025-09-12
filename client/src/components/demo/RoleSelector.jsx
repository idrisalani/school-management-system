// @ts-nocheck

// client/src/components/demo/RoleSelector.jsx - Beautiful Modal Style Design
import React from "react";
import { useNavigate } from "react-router-dom";
import { Shield, User, Book, Users, X, Home } from "lucide-react";
import { useDemo } from "../../contexts/DemoContext";

const RoleSelector = ({ onRoleSelect }) => {
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
        secondary: "bg-purple-100",
        hover: "hover:bg-purple-700",
        border: "border-purple-200",
        text: "text-purple-600",
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
        secondary: "bg-green-100",
        hover: "hover:bg-green-700",
        border: "border-green-200",
        text: "text-green-600",
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
        secondary: "bg-blue-100",
        hover: "hover:bg-blue-700",
        border: "border-blue-200",
        text: "text-blue-600",
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
        secondary: "bg-orange-100",
        hover: "hover:bg-orange-700",
        border: "border-orange-200",
        text: "text-orange-600",
      },
    },
  };

  const handleRoleSelect = (role) => {
    if (onRoleSelect) {
      onRoleSelect(role);
    } else {
      enterDemoMode(role);
    }
  };

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative px-8 pt-8 pb-6 border-b border-gray-100">
          <button
            onClick={handleGoHome}
            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close and go home"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Choose Your Demo Experience
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Select a role to explore EduManager with realistic sample data
            </p>
          </div>
        </div>

        {/* Role Cards */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {availableRoles.map((role) => {
              const config = roleConfig[role];
              const Icon = config.icon;

              return (
                <div
                  key={role}
                  className={`relative bg-white rounded-xl border-2 ${config.colors.border} hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group`}
                  onClick={() => handleRoleSelect(role)}
                >
                  {/* Role Header */}
                  <div className="p-6 pb-4">
                    <div className="flex items-start space-x-4 mb-4">
                      <div
                        className={`w-12 h-12 rounded-lg ${config.colors.secondary} flex items-center justify-center flex-shrink-0`}
                      >
                        <Icon className={`h-6 w-6 ${config.colors.text}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {config.title}
                        </h3>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${config.colors.secondary} ${config.colors.text}`}
                        >
                          {config.subtitle}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-700 mb-4 leading-relaxed">
                      {config.description}
                    </p>

                    {/* Key Features */}
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-800 mb-3">
                        Key Features:
                      </h4>
                      <ul className="space-y-2">
                        {config.features.map((feature, index) => (
                          <li
                            key={index}
                            className="flex items-center text-sm text-gray-600"
                          >
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3 flex-shrink-0"></div>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="px-6 pb-6">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRoleSelect(role);
                      }}
                      className={`w-full py-3 px-4 rounded-lg text-white font-semibold transition-all duration-200 ${config.colors.primary} ${config.colors.hover} shadow-md hover:shadow-lg transform group-hover:scale-105`}
                    >
                      Try {config.title} Demo
                    </button>
                  </div>

                  {/* Hover Overlay Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-xl pointer-events-none"></div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 pb-8">
          <div className="text-center">
            <button
              onClick={handleGoHome}
              className="inline-flex items-center space-x-2 px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Home className="h-4 w-4" />
              <span>Back to Home</span>
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              All demo interactions use sample data. No real information is
              stored or affected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelector;
