// @ts-check
import React, { useState } from "react";
import PropTypes from "prop-types";

/**
 * Simple Tabs component
 * @param {object} props - Component properties
 * @param {React.ReactNode} props.children - Tab content
 * @param {string} props.defaultValue - Default active tab
 * @param {string} [props.value] - Controlled active tab
 * @param {function} [props.onValueChange] - Callback when tab changes
 * @param {string} [props.className] - Additional CSS classes
 * @returns {React.ReactElement} Tabs component
 */
export const Tabs = ({
  children,
  defaultValue,
  value,
  onValueChange,
  className = "",
  ...props
}) => {
  const [internalActiveTab] = useState(defaultValue);

  // Use controlled or uncontrolled state
  const activeTab = value !== undefined ? value : internalActiveTab;

  return (
    <div className={className} data-active-tab={activeTab} {...props}>
      {children}
    </div>
  );
};

/**
 * Tabs list component (container for tab triggers)
 * @param {object} props - Component properties
 * @param {React.ReactNode} props.children - Tab triggers
 * @param {string} [props.className] - Additional CSS classes
 * @returns {React.ReactElement} TabsList component
 */
export const TabsList = ({ children, className = "", ...props }) => (
  <div
    className={`inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground ${className}`}
    {...props}
  >
    {children}
  </div>
);

/**
 * Tab trigger component (clickable tab)
 * @param {object} props - Component properties
 * @param {React.ReactNode} props.children - Tab label
 * @param {string} props.value - Tab value/identifier
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.disabled] - Whether tab is disabled
 * @returns {React.ReactElement} TabsTrigger component
 */
export const TabsTrigger = ({
  children,
  value,
  className = "",
  disabled = false,
  ...props
}) => {
  const handleClick = () => {
    if (!disabled) {
      // Find the parent Tabs component and trigger change
      const tabsElement = document.querySelector(`[data-active-tab]`);
      if (tabsElement) {
        const currentActiveTab = tabsElement.getAttribute("data-active-tab");
        if (currentActiveTab !== value) {
          // Dispatch custom event for tab change
          const event = new CustomEvent("tabChange", {
            detail: { value },
            bubbles: true,
          });
          tabsElement.dispatchEvent(event);
        }
      }
    }
  };

  // Listen for tab changes
  React.useEffect(() => {
    const handleTabChange = (event) => {
      if (event.detail.value === value) {
        // This tab is now active
      }
    };

    document.addEventListener("tabChange", handleTabChange);
    return () => document.removeEventListener("tabChange", handleTabChange);
  }, [value]);

  // Get active state from closest tabs container
  const [isActive, setIsActive] = React.useState(false);

  React.useEffect(() => {
    const checkActiveState = () => {
      const tabsElement = document.querySelector(
        `[data-active-tab="${value}"]`
      );
      setIsActive(!!tabsElement);
    };

    checkActiveState();
    const interval = setInterval(checkActiveState, 100);
    return () => clearInterval(interval);
  }, [value]);

  return (
    <button
      type="button"
      className={`
        inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 
        text-sm font-medium ring-offset-background transition-all focus-visible:outline-none 
        focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 
        disabled:pointer-events-none disabled:opacity-50
        ${
          isActive
            ? "bg-background text-foreground shadow-sm"
            : "hover:bg-background/50 hover:text-foreground"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${className}
      `}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

/**
 * Tab content component (content for each tab)
 * @param {object} props - Component properties
 * @param {React.ReactNode} props.children - Tab content
 * @param {string} props.value - Tab value/identifier
 * @param {string} [props.className] - Additional CSS classes
 * @returns {React.ReactElement|null} TabsContent component
 */
export const TabsContent = ({ children, value, className = "", ...props }) => {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const checkVisibility = () => {
      const tabsElement = document.querySelector(
        `[data-active-tab="${value}"]`
      );
      setIsVisible(!!tabsElement);
    };

    checkVisibility();
    const interval = setInterval(checkVisibility, 100);
    return () => clearInterval(interval);
  }, [value]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// PropTypes
Tabs.propTypes = {
  children: PropTypes.node.isRequired,
  defaultValue: PropTypes.string,
  value: PropTypes.string,
  onValueChange: PropTypes.func,
  className: PropTypes.string,
};

TabsList.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

TabsTrigger.propTypes = {
  children: PropTypes.node.isRequired,
  value: PropTypes.string.isRequired,
  className: PropTypes.string,
  disabled: PropTypes.bool,
};

TabsContent.propTypes = {
  children: PropTypes.node.isRequired,
  value: PropTypes.string.isRequired,
  className: PropTypes.string,
};

// Export all components
const TabsComponents = {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
};

export default TabsComponents;
