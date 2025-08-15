// @ts-nocheck

// src/features/public/Demo.jsx
import React from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Users,
  CalendarDays,
  ClipboardList,
  Bell,
  BarChart3,
  GraduationCap,
  ArrowLeft,
} from "lucide-react";

const DemoFeatures = [
  {
    icon: <Users className="w-6 h-6" />,
    title: "User Management",
    description:
      "Try our efficient user management system with role-based access control.",
  },
  {
    icon: <BookOpen className="w-6 h-6" />,
    title: "Academic Management",
    description:
      "Experience how easy it is to manage courses, assignments, and grades.",
  },
  {
    icon: <CalendarDays className="w-6 h-6" />,
    title: "Attendance",
    description: "Test our automated attendance tracking and reporting system.",
  },
  {
    icon: <ClipboardList className="w-6 h-6" />,
    title: "Assessment Tools",
    description:
      "Create sample tests and assignments with our intuitive tools.",
  },
  {
    icon: <Bell className="w-6 h-6" />,
    title: "Communication",
    description: "Explore our integrated messaging and notification system.",
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "Analytics",
    description: "View sample reports and analytics dashboards.",
  },
];

const Demo = () => {
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
              <Link
                to="/register"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Interactive Demo
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Experience EduManager features with our interactive demo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {DemoFeatures.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="text-indigo-600 mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 mb-4">{feature.description}</p>
              <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                Try Now →
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="space-y-4">
            <Link
              to="/register"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              Start Free Trial
            </Link>
            <p className="text-sm text-gray-500">
              No credit card required. 14-day free trial available.
            </p>
            <div className="mt-6">
              <Link
                to="/"
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                ← Return to Homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Demo;
