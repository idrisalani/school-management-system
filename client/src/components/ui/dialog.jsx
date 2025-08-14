// @ts-nocheck
import React from "react";
import PropTypes from "prop-types";
import { X } from "lucide-react";

/**
 * Dialog component for modal interactions
 * @param {object} props - Component properties
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Function} props.onClose - Function to call when closing the dialog
 * @param {React.ReactNode} props.children - Dialog content
 * @returns {React.ReactElement|null} Dialog component or null if not open
 */
const Dialog = ({ open, onClose, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="z-50 grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg sm:rounded-lg">
        {children}
      </div>
    </div>
  );
};

/**
 * Dialog trigger component for opening the dialog
 * @param {object} props - Component properties
 * @param {React.ReactNode} props.children - Trigger content
 * @param {Function} props.onClick - Function to call when clicked
 * @returns {React.ReactElement} Dialog trigger component
 */
const DialogTrigger = ({ children, onClick }) => {
  return <div onClick={onClick}>{children}</div>;
};

/**
 * Dialog content wrapper component
 * @param {object} props - Component properties
 * @param {React.ReactNode} props.children - Content to display
 * @param {Function} [props.onClose] - Optional function to call when closing
 * @returns {React.ReactElement} Dialog content component
 */
const DialogContent = ({ children, onClose }) => {
  return (
    <div className="relative">
      {children}
      {onClose && (
        <button
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      )}
    </div>
  );
};

/**
 * Dialog header component
 * @param {object} props - Component properties
 * @param {React.ReactNode} props.children - Header content
 * @param {string} [props.className] - Additional CSS classes
 * @returns {React.ReactElement} Dialog header component
 */
const DialogHeader = ({ children, className = "", ...props }) => (
  <div
    className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`}
    {...props}
  >
    {children}
  </div>
);

/**
 * Dialog footer component
 * @param {object} props - Component properties
 * @param {React.ReactNode} props.children - Footer content
 * @param {string} [props.className] - Additional CSS classes
 * @returns {React.ReactElement} Dialog footer component
 */
const DialogFooter = ({ children, className = "", ...props }) => (
  <div
    className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`}
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
 * @returns {React.ReactElement} Dialog title component
 */
const DialogTitle = ({ children, className = "", ...props }) => (
  <h3
    className={`text-lg font-semibold leading-none tracking-tight ${className}`}
    {...props}
  >
    {children}
  </h3>
);

/**
 * Dialog description component
 * @param {object} props - Component properties
 * @param {React.ReactNode} props.children - Description content
 * @param {string} [props.className] - Additional CSS classes
 * @returns {React.ReactElement} Dialog description component
 */
const DialogDescription = ({ children, className = "", ...props }) => (
  <p className={`text-sm text-muted-foreground ${className}`} {...props}>
    {children}
  </p>
);

Dialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};

DialogTrigger.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func.isRequired,
};

DialogContent.propTypes = {
  children: PropTypes.node.isRequired,
  onClose: PropTypes.func,
};

DialogHeader.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

DialogFooter.propTypes = {
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

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
