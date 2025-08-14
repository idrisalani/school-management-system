// @ts-nocheck
import React from "react";
import PropTypes from "prop-types";
import { X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../alert";
import Button from "../button";

/**
 * @typedef {object} NotificationProps
 * @property {string} [title] - Title of the notification
 * @property {string} message - Message to display
 * @property {string} [variant] - Variant of the notification (default, success, warning, destructive)
 * @property {boolean} [showClose] - Whether to show close button
 * @property {() => void} [onClose] - Callback when notification is closed
 * @property {number} [duration] - Duration in ms before auto-closing (0 for no auto-close)
 */

/**
 * A notification component that displays messages and alerts with various styles and behaviors
 * @param {NotificationProps} props - Configuration options for the notification including title, message, variant, and behavior
 * @returns {React.ReactElement} A rendered notification component that displays the message with specified styling and behavior
 */
const Notification = ({
  title,
  message,
  variant = "default",
  showClose = true,
  onClose,
  duration = 0,
}) => {
  React.useEffect(() => {
    if (duration > 0 && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <Alert
      variant={variant}
      className="max-w-md w-full animate-in fade-in slide-in-from-top-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          {title && <AlertTitle>{title}</AlertTitle>}
          <AlertDescription>{message}</AlertDescription>
        </div>
        {showClose && onClose && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close notification</span>
          </Button>
        )}
      </div>
    </Alert>
  );
};

Notification.propTypes = {
  title: PropTypes.string,
  message: PropTypes.string.isRequired,
  variant: PropTypes.oneOf(["default", "success", "warning", "destructive"]),
  showClose: PropTypes.bool,
  onClose: PropTypes.func,
  duration: PropTypes.number,
};

export default Notification;
