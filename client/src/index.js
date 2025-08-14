// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.js";
import reportWebVitals from "./reportWebVitals.js";
import { loadFonts } from "./utils/fontLoader.js";

/**
 * Removes the loading screen once the app is mounted
 */
const removeLoader = () => {
  const loader = document.querySelector(".app-loading");
  if (loader instanceof HTMLElement) {
    loader.style.opacity = "0";
    loader.style.transform = "translateY(-20px)";
    setTimeout(() => loader.remove(), 300);
  }
};

/**
 * Handle initialization errors
 * @param {unknown} error - Any type of error that occurred
 */
const handleInitError = (error) => {
  console.error("Application initialization failed:", error);

  const errorMessage =
    error instanceof Error ? error.message : "An unexpected error occurred";

  const loader = document.querySelector(".app-loading");
  if (loader instanceof HTMLElement) {
    loader.innerHTML = `
      <div class="app-loading__error">
        <h2>Failed to load application</h2>
        <p>${errorMessage}</p>
      </div>
    `;
  }
};

/**
 * Initialize the application
 */
const initializeApp = async () => {
  try {
    // Load fonts first
    await loadFonts();

    // Get root element with type checking
    const rootElement = document.getElementById("root");
    if (!rootElement) {
      throw new Error("Failed to find the root element");
    }

    // Create root and render app
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );

    // Remove loader after render
    removeLoader();

    // Report web vitals
    reportWebVitals(console.log);
  } catch (err) {
    handleInitError(err);
  }
};

// Start the application
initializeApp();

// Register service worker for PWA support
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").catch((error) => {
      console.log("Service worker registration failed:", error);
    });
  });
}
