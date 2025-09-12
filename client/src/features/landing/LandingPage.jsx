// @ts-nocheck

// src/features/landing/LandingPage.jsx
import React from "react";
import { Link } from "react-router-dom";
import {
  Users,
  BookOpen,
  Calendar,
  ClipboardCheck,
  GraduationCap,
  Bell,
  BarChart3, // Changed from ChartBar
} from "lucide-react";
import { DemoLandingSection } from "../../components/demo/DemoLandingSection";

const LandingPage = () => {
  const features = [
    {
      icon: <Users className="w-6 h-6" />,
      title: "User Management",
      description:
        "Efficiently manage students, teachers, and staff with role-based access control.",
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Academic Management",
      description:
        "Handle courses, assignments, and grades in one centralized system.",
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "Attendance Tracking",
      description:
        "Monitor student and teacher attendance with automated reporting.",
    },
    {
      icon: <ClipboardCheck className="w-6 h-6" />,
      title: "Assessment Tools",
      description:
        "Create and grade assignments, tests, and track student progress.",
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: "Communication",
      description:
        "Seamless communication between teachers, students, and parents.",
    },
    {
      icon: <BarChart3 className="w-6 h-6" />, // Changed from ChartBar
      title: "Analytics",
      description:
        "Comprehensive reports and analytics for data-driven decisions.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <GraduationCap className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                EduManager
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-gray-600 hover:text-gray-900">
                Login
              </Link>
              <Link
                to="/register"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
        <div className="text-center">
          <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">Modern School Management</span>
            <span className="block text-indigo-600">Made Simple</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Streamline your educational institution&apos;s operations with our
            comprehensive management system. From attendance tracking to grade
            management, we&apos;ve got everything you need.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <Link
                to="/register"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
              >
                Get Started
              </Link>
            </div>
            <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              {/* Replace the old demo link with DemoLandingSection */}
              <div className="w-full flex items-center justify-center">
                <DemoLandingSection />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="text-indigo-600 mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-indigo-600 mt-16">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Ready to transform your school management?
            </h2>
            <p className="mt-4 text-lg leading-6 text-indigo-100">
              Join thousands of schools already using EduManager to improve
              their operations.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/register"
                className="w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 sm:w-auto"
              >
                Get Started Today
              </Link>
              {/* Add another demo option in CTA section */}
              <div className="demo-cta-section">
                <DemoLandingSection />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="mt-8 border-t border-gray-200 pt-8 md:flex md:items-center md:justify-between">
            <div className="flex space-x-6 md:order-2">
              <Link to="/privacy" className="text-gray-400 hover:text-gray-500">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-gray-400 hover:text-gray-500">
                Terms of Service
              </Link>
              <Link to="/contact" className="text-gray-400 hover:text-gray-500">
                Contact
              </Link>
            </div>
            <p className="mt-8 text-base text-gray-400 md:mt-0 md:order-1">
              © 2025 EduManager. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
