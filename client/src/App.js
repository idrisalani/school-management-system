// @ts-check
import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { DemoProvider } from "./contexts/DemoContext.jsx";
import { ToastProvider } from "./components/Toast/ToastProvider.jsx";
import AppRoutes from "./routes/index.js";

/**
 * Main application component - REFACTORED to work with all context providers
 * @returns {React.ReactElement} Root application component with routing and context providers
 */
const App = () => {
  return (
    <AuthProvider>
      <Router>
        <DemoProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </DemoProvider>
      </Router>
    </AuthProvider>
  );
};

export default App;
