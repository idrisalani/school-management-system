// src/App.js - Step 2: Add real landing page
import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

// Real Landing Page Component (simplified version without external UI dependencies)
const LandingPage = () => (
  <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
    {/* Navigation */}
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-indigo-600 rounded flex items-center justify-center">
              <span className="text-white font-bold">E</span>
            </div>
            <span className="ml-2 text-xl font-bold text-gray-900">
              EduManager
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              to="/login"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
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
          Streamline your educational institution's operations with our
          comprehensive management system. From attendance tracking to grade
          management, we've got everything you need.
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
            <Link
              to="/demo"
              className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
            >
              Live Demo
            </Link>
          </div>
        </div>
      </div>
    </div>

    {/* Features Grid */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {[
          {
            title: "User Management",
            description:
              "Efficiently manage students, teachers, and staff with role-based access control.",
          },
          {
            title: "Academic Management",
            description:
              "Handle courses, assignments, and grades in one centralized system.",
          },
          {
            title: "Attendance Tracking",
            description:
              "Monitor student and teacher attendance with automated reporting.",
          },
          {
            title: "Assessment Tools",
            description:
              "Create and grade assignments, tests, and track student progress.",
          },
          {
            title: "Communication",
            description:
              "Seamless communication between teachers, students, and parents.",
          },
          {
            title: "Analytics",
            description:
              "Comprehensive reports and analytics for data-driven decisions.",
          },
        ].map((feature, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-indigo-600 font-semibold">{index + 1}</span>
            </div>
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
            Join thousands of schools already using EduManager to improve their
            operations.
          </p>
          <Link
            to="/register"
            className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 sm:w-auto"
          >
            Get Started Today
          </Link>
        </div>
      </div>
    </div>
  </div>
);

// Simple Login Page
const LoginPage = () => (
  <div
    style={{
      padding: "40px",
      fontFamily: "Arial, sans-serif",
      textAlign: "center",
    }}
  >
    <h1 style={{ color: "green", marginBottom: "20px" }}>Login Page</h1>
    <p style={{ marginBottom: "20px" }}>Login form will be implemented here</p>
    <Link to="/" style={{ color: "blue", textDecoration: "underline" }}>
      ← Back to Home
    </Link>
  </div>
);

// Simple Register Page
const RegisterPage = () => (
  <div
    style={{
      padding: "40px",
      fontFamily: "Arial, sans-serif",
      textAlign: "center",
    }}
  >
    <h1 style={{ color: "orange", marginBottom: "20px" }}>Register Page</h1>
    <p style={{ marginBottom: "20px" }}>
      Registration form will be implemented here
    </p>
    <Link to="/" style={{ color: "blue", textDecoration: "underline" }}>
      ← Back to Home
    </Link>
  </div>
);

// Simple Demo Page
const DemoPage = () => (
  <div
    style={{
      padding: "40px",
      fontFamily: "Arial, sans-serif",
      textAlign: "center",
    }}
  >
    <h1 style={{ color: "purple", marginBottom: "20px" }}>Live Demo</h1>
    <p style={{ marginBottom: "20px" }}>
      Demo functionality will be implemented here
    </p>
    <Link to="/" style={{ color: "blue", textDecoration: "underline" }}>
      ← Back to Home
    </Link>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/demo" element={<DemoPage />} />
        <Route
          path="*"
          element={
            <div style={{ padding: "40px", textAlign: "center" }}>
              <h1>Page not found</h1>
              <Link to="/">Go Home</Link>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
