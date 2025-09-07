// src/App.js - Step 1: Add basic routing
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Simple test components
const LandingPage = () => (
  <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
    <h1 style={{ color: "blue" }}>EduManager - Landing Page</h1>
    <p>This is the landing page!</p>
    <a href="/login" style={{ marginRight: "10px", color: "blue" }}>
      Login
    </a>
    <a href="/register" style={{ color: "blue" }}>
      Register
    </a>
  </div>
);

const LoginPage = () => (
  <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
    <h1 style={{ color: "green" }}>Login Page</h1>
    <p>Login form would go here</p>
    <a href="/" style={{ color: "blue" }}>
      Back to Home
    </a>
  </div>
);

const RegisterPage = () => (
  <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
    <h1 style={{ color: "orange" }}>Register Page</h1>
    <p>Registration form would go here</p>
    <a href="/" style={{ color: "blue" }}>
      Back to Home
    </a>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<div>Page not found</div>} />
      </Routes>
    </Router>
  );
}

export default App;
