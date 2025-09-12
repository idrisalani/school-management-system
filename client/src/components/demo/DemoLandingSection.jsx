// @ts-nocheck

import React, { useState } from "react";
import { useDemo } from "../../contexts/DemoContext";
import { Shield, User, Book, Users, X } from "lucide-react";

export const DemoLandingSection = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { enterDemoMode, availableRoles } = useDemo();

  const roleConfig = {
    admin: {
      icon: Shield,
      title: "School Administrator",
      description:
        "Manage the entire school system with comprehensive analytics and controls",
      features: [
        "School-wide analytics",
        "User management",
        "Financial reporting",
        "System settings",
      ],
      color: "bg-purple-500",
    },
    teacher: {
      icon: User,
      title: "Teacher",
      description:
        "Manage classes, create assignments, and track student progress",
      features: [
        "Assignment creation",
        "Grade management",
        "Class analytics",
        "Student progress",
      ],
      color: "bg-green-500",
    },
    student: {
      icon: Book,
      title: "Student",
      description:
        "View assignments, check grades, and track academic progress",
      features: [
        "Assignment submissions",
        "Grade tracking",
        "Attendance view",
        "Academic progress",
      ],
      color: "bg-blue-500",
    },
    parent: {
      icon: Users,
      title: "Parent",
      description:
        "Monitor your children's academic progress and school activities",
      features: [
        "Children overview",
        "Grade monitoring",
        "Attendance tracking",
        "Communication",
      ],
      color: "bg-orange-500",
    },
  };

  const handleRoleSelect = (role) => {
    setIsOpen(false);
    enterDemoMode(role);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
      >
        Live Demo
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
          <div className="relative p-6">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Choose Your Demo Experience
              </h2>
              <p className="text-gray-600">
                Select a role to explore EduManager with realistic sample data
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {availableRoles.map((role) => {
                const config = roleConfig[role];
                const Icon = config.icon;

                return (
                  <div
                    key={role}
                    className="border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleRoleSelect(role)}
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <div
                        className={`p-2 rounded-lg ${config.color} text-white`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">
                          {config.title}
                        </h3>
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded mt-1">
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-600 mb-4">{config.description}</p>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">
                        Key Features:
                      </p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {config.features.map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button className="w-full mt-4 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors">
                      Try {config.title} Demo
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
