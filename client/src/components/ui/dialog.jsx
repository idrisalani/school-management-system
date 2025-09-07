// @ts-check
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

/**
 * Simple Dialog hook for managing open state
 * @returns {{ isOpen: boolean, open: function, close: function, toggle: function }}
 */
export const useDialog = () => {
  const [isOpen, setIsOpen] = useState(false);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(!isOpen),
  };
};

/**
 * Dialog content component
 * @param {object} props - Component properties
 * @param {React.ReactNode} props.children - Content
 * @param {boolean} props.isOpen - Whether dialog is open
 * @param {function} props.onClose - Close handler
 * @param {string} [props.className] - Additional CSS classes
 * @returns {React.ReactElement|null} DialogContent component
 */
export const Dialog = ({
  children,
  isOpen,
  onClose,
  className = "",
  ...props
}) => {
  // Close dialog when pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden"; // Prevent background scroll

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={(e) => {
          e.preventDefault();
          if (onClose) {
            onClose();
          }
        }}
      />

      {/* Dialog */}
      <div
        className={`
          relative z-50 grid w-full max-w-lg gap-4 border bg-background p-6 
          shadow-lg duration-200 animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2
          sm:rounded-lg md:w-full
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    </div>
  );
};

/**
 * Dialog header component
 * @param {object} props - Component properties
 * @param {React.ReactNode} props.children - Header content
 * @param {string} [props.className] - Additional CSS classes
 * @returns {React.ReactElement} DialogHeader component
 */
export const DialogHeader = ({ children, className = "", ...props }) => (
  <div
    className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`}
    {...props}
  >
    {children}
  </div>
);

/**
 * Dialog title component
 * @param {object} props - Component properties
 * @param {React.ReactNode} props.children - Title content
 * @param {string} [props.className] - Additional CSS classes
 * @returns {React.ReactElement} DialogTitle component
 */
export const DialogTitle = ({ children, className = "", ...props }) => (
  <h2
    className={`text-lg font-semibold leading-none tracking-tight ${className}`}
    {...props}
  >
    {children}
  </h2>
);

/**
 * Dialog description component
 * @param {object} props - Component properties
 * @param {React.ReactNode} props.children - Description content
 * @param {string} [props.className] - Additional CSS classes
 * @returns {React.ReactElement} DialogDescription component
 */
export const DialogDescription = ({ children, className = "", ...props }) => (
  <p className={`text-sm text-muted-foreground ${className}`} {...props}>
    {children}
  </p>
);

/**
 * Dialog footer component
 * @param {object} props - Component properties
 * @param {React.ReactNode} props.children - Footer content
 * @param {string} [props.className] - Additional CSS classes
 * @returns {React.ReactElement} DialogFooter component
 */
export const DialogFooter = ({ children, className = "", ...props }) => (
  <div
    className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`}
    {...props}
  >
    {children}
  </div>
);

// PropTypes
Dialog.propTypes = {
  children: PropTypes.node.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  className: PropTypes.string,
};

DialogHeader.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

DialogTitle.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

DialogDescription.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

DialogFooter.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

// Export default object with proper variable assignment
const DialogComponents = {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  useDialog,
};

export default DialogComponents;
