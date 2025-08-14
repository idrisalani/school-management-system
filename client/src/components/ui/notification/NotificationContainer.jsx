// @ts-check
import React, { useState, useCallback } from "react";
import PropTypes from "prop-types";
import Notification from "./Notification";

/**
 * @typedef {object} NotificationItem
 * @property {string} id - Unique identifier
 * @property {string} [title] - Notification title
 * @property {string} message - Notification message
 * @property {string} [variant] - Notification variant
 * @property {number} [duration] - Auto-close duration
 */

/**
 * @typedef {object} NotificationData
 * @property {string} [title] - Notification title
 * @property {string} message - Message to display
 * @property {string} [variant] - Notification variant
 * @property {number} [duration] - Auto-close duration
 */

/**
 * @typedef {object} NotificationContextType
 * @property {(data: NotificationData) => string} showNotification - Shows a notification with given content
 * @property {(notificationId: string) => void} hideNotification - Hides a notification with given ID
 */

/** @type {NotificationContextType} */
const defaultContext = {
  showNotification: () => "",
  hideNotification: () => {},
};

export const NotificationContext = React.createContext(defaultContext);

/**
 * Custom hook to access notification functionality
 * @returns {NotificationContextType} The notification context methods
 */
export const useNotification = () => {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};

/**
 * Provider component that manages notifications across the application
 * @param {object} props - The provider props
 * @param {React.ReactNode} props.children - The child components to wrap
 * @returns {React.ReactElement} The notification provider component
 */
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(
    /** @type {NotificationItem[]} */ ([])
  );

  const showNotification = useCallback((data) => {
    const id = Math.random().toString(36).substring(7);
    setNotifications((prev) => [...prev, { ...data, id }]);
    return id;
  }, []);

  const hideNotification = useCallback((notificationId) => {
    setNotifications((prev) =>
      prev.filter((item) => item.id !== notificationId)
    );
  }, []);

  return (
    <NotificationContext.Provider
      value={{ showNotification, hideNotification }}
    >
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {notifications.map(({ id, title, message, variant, duration }) => (
          <Notification
            key={id}
            title={title}
            message={message}
            variant={variant}
            duration={duration}
            onClose={() => hideNotification(id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default NotificationProvider;
