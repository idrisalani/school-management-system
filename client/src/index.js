// @ts-nocheck

// src/index.js - Simplified version
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

// Remove loading screen if it exists
const removeLoader = () => {
  const loader = document.querySelector(".app-loading");
  if (loader) {
    loader.style.display = "none";
  }
};

// Get root element and render app
const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  // Remove the loading screen after React renders
  setTimeout(removeLoader, 100);
} else {
  console.error("Root element not found");
}
