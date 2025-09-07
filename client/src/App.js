// @ts-check
import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import AppRoutes from "./routes/index.js";

/**
 * Main application component - REFACTORED to work with fixed AuthContext
 * @returns {React.ReactElement} Root application component with routing and context providers
 */
const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;
