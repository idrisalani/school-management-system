// @ts-nocheck

// client/src/components/demo/ModalRoleSelector.jsx
// Modal overlay for "Switch Role" from demo dashboards

import React from "react";
import { Shield, User, Book, Users, X } from "lucide-react";
import { useDemo } from "../../contexts/DemoContext";

const ModalRoleSelector = ({ isOpen, onClose, onRoleSelect }) => {
  const { enterDemoMode, availableRoles } = useDemo();

  const roleConfig = {
    admin: {
      icon: Shield,
      title: "School Administrator",
      description:
        "Manage the entire school system with comprehensive analytics",
      color: "bg-purple-600",
      lightColor: "bg-purple-50",
      textColor: "text-purple-600",
      hoverColor: "hover:bg-purple-700",
    },
    teacher: {
      icon: User,
      title: "Teacher",
      description: "Manage classes, create assignments, and track progress",
      color: "bg-green-600",
      lightColor: "bg-green-50",
      textColor: "text-green-600",
      hoverColor: "hover:bg-green-700",
    },
    student: {
      icon: Book,
      title: "Student",
      description: "View assignments, check grades, and track progress",
      color: "bg-blue-600",
      lightColor: "bg-blue-50",
      textColor: "text-blue-600",
      hoverColor: "hover:bg-blue-700",
    },
    parent: {
      icon: Users,
      title: "Parent",
      description: "Monitor your children's academic progress",
      color: "bg-orange-600",
      lightColor: "bg-orange-50",
      textColor: "text-orange-600",
      hoverColor: "hover:bg-orange-700",
    },
  };

  const handleRoleSelect = (role) => {
    if (onRoleSelect) {
      onRoleSelect(role);
    } else {
      enterDemoMode(role);
    }
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-slideUp">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-gray-100">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Switch Demo Role
            </h2>
            <p className="text-gray-600">
              Choose a different role to explore other perspectives
            </p>
          </div>
        </div>

        {/* Role Cards */}
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {availableRoles.map((role) => {
              const config = roleConfig[role];
              const Icon = config.icon;

              return (
                <div
                  key={role}
                  className="group bg-white border-2 border-gray-100 rounded-xl p-4 hover:border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer"
                  onClick={() => handleRoleSelect(role)}
                >
                  {/* Role Header */}
                  <div className="flex items-center space-x-3 mb-3">
                    <div
                      className={`w-10 h-10 rounded-lg ${config.lightColor} flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon className={`h-5 w-5 ${config.textColor}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-700">
                        {config.title}
                      </h3>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    {config.description}
                  </p>

                  {/* Action Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRoleSelect(role);
                    }}
                    className={`w-full py-2.5 px-4 rounded-lg text-white font-medium text-sm transition-all duration-200 ${config.color} ${config.hoverColor} shadow-md hover:shadow-lg transform group-hover:scale-105`}
                  >
                    Switch to {config.title}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Switching roles will take you to a new demo environment with
              different sample data
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalRoleSelector;
