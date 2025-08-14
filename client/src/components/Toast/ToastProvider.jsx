// client/src/components/Toast/ToastProvider.jsx
import React, { createContext, useContext, useCallback, useState } from "react";
import PropTypes from "prop-types";

/**
 * @typedef {'info' | 'success' | 'error' | 'warning'} ToastType
 */

/**
 * @typedef {object} Toast
 * @property {string} id - Unique identifier for the toast
 * @property {string} message - Toast message content
 * @property {ToastType} type - Type of toast
 */

/**
 * @typedef {object} ToastContextValue
 * @property {(message: string, type?: ToastType, duration?: number) => void} addToast - Function to add a new toast
 * @property {(id: string) => void} removeToast - Function to remove a toast
 */

/** @type {React.Context<ToastContextValue>} */
const ToastContext = createContext(
  /** @type {ToastContextValue} */ ({
    addToast: () => {
      throw new Error("ToastContext not initialized");
    },
    removeToast: () => {
      throw new Error("ToastContext not initialized");
    },
  })
);

export const ToastProvider = ({ children }) => {
  /** @type {[Toast[], React.Dispatch<React.SetStateAction<Toast[]>>]} */
  const [toasts, setToasts] = useState(/** @type {Toast[]} */ ([]));

  const addToast = useCallback(
    (message, /** @type {ToastType} */ type = "info", duration = 5000) => {
      const id = Math.random().toString(36).substr(2, 9);

      /** @type {Toast} */
      const newToast = { id, message, type };

      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, duration);
    },
    []
  );

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  /** @type {ToastContextValue} */
  const contextValue = {
    addToast,
    removeToast,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-lg px-4 py-3 shadow-lg transform transition-all duration-300 ${
              toast.type === "error"
                ? "bg-red-500"
                : toast.type === "success"
                  ? "bg-green-500"
                  : toast.type === "warning"
                    ? "bg-yellow-500"
                    : "bg-blue-500"
            } text-white`}
          >
            <span className="mr-2">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 text-white opacity-75 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

ToastProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Custom hook to use toast functionality
 * @returns {ToastContextValue} Toast context value
 * @throws {Error} When used outside of ToastProvider
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export default ToastProvider;
