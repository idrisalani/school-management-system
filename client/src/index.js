// src/index.js - Fixed version with safety checks
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.js";

// CONDITIONAL IMPORTS - Comment out these lines if the files don't exist in your project
// Uncomment the lines below only if you have these files:
// import reportWebVitals from "./reportWebVitals.js";
import { loadFonts } from "./utils/fontLoader.js";

// If you have these files, uncomment the imports above and remove these placeholder declarations:
const reportWebVitals = null; // Remove this line if you uncomment the import above
// const loadFonts = null; // Remove this line if you uncomment the import above

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
      <div class="app-loading__error" style="text-align: center; padding: 20px;">
        <h2 style="color: #dc2626; margin-bottom: 10px;">Failed to load application</h2>
        <p style="color: #6b7280; margin-bottom: 20px;">${errorMessage}</p>
        <button onclick="window.location.reload()" style="background: #3b82f6; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
          Retry
        </button>
      </div>
    `;
  }
};

/**
 * Initialize the application with safety checks for optional features
 */
const initializeApp = async () => {
  try {
    // SAFE FONT LOADING - Don't block app rendering if font loading fails
    if (loadFonts && typeof loadFonts === "function") {
      try {
        console.log("Loading fonts...");
        await loadFonts();
        console.log("Fonts loaded successfully");
      } catch (fontError) {
        console.warn(
          "Font loading failed, continuing without custom fonts:",
          fontError
        );
        // App continues to load even if fonts fail
      }
    } else {
      console.log("Font loader not available, skipping font loading");
    }

    // Get root element with type checking
    const rootElement = document.getElementById("root");
    if (!rootElement) {
      throw new Error("Failed to find the root element");
    }

    // Create root and render app
    console.log("Rendering React application...");
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );

    // Remove loader after render
    removeLoader();
    console.log("Application rendered successfully");

    // SAFE WEB VITALS REPORTING - Don't block if web vitals fail
    if (reportWebVitals && typeof reportWebVitals === "function") {
      try {
        //reportWebVitals(console.log);
        console.log("Web vitals reporting initialized");
      } catch (vitalsError) {
        console.warn("Web vitals reporting failed:", vitalsError);
        // App continues to work even if web vitals fail
      }
    } else {
      console.log("Web vitals not available, skipping");
    }
  } catch (err) {
    console.error("Critical application initialization error:", err);
    handleInitError(err);
  }
};

// Start the application
console.log("Starting School Management System...");
initializeApp();

// OPTIONAL: Register service worker for PWA support
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log("Service worker registered successfully:", registration);
      })
      .catch((error) => {
        console.log(
          "Service worker registration failed (this is optional):",
          error
        );
        // App continues to work even if service worker fails
      });
  });
} else {
  console.log("Service worker not supported in this browser");
}
