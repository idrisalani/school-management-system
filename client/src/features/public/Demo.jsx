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
              className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-indigo-600 mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            to="/register"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Start Free Trial
          </Link>
          <p className="mt-2 text-sm text-gray-500">
            No credit card required. 14-day free trial available.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Demo;
