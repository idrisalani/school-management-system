// @ts-check
import React from "react";
import PropTypes from "prop-types";

/**
 * Card component with styling
 * @param {object} props - Component properties
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.ReactNode} [props.children] - Card content
 * @returns {React.ReactElement} Card component
 */
const Card = ({ className = "", children, ...props }) => {
  return (
    <div
      className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Card header component
 * @param {object} props - Component properties
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.ReactNode} [props.children] - Header content
 * @returns {React.ReactElement} Card header component
 */
const CardHeader = ({ className = "", children, ...props }) => {
  return (
    <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props}>
      {children}
    </div>
  );
};

/**
 * Card title component
 * @param {object} props - Component properties
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.ReactNode} props.children - Title content
 * @returns {React.ReactElement|null} Card title component
 */
const CardTitle = ({ className = "", children, ...props }) => {
  // Only render h3 if there's content
  if (!children) {
    return null;
  }

  return (
    <h3
      className={`text-2xl font-semibold leading-none tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
};

/**
 * Card content component
 * @param {object} props - Component properties
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.ReactNode} [props.children] - Content
 * @returns {React.ReactElement} Card content component
 */
const CardContent = ({ className = "", children, ...props }) => {
  return (
    <div className={`p-6 pt-0 ${className}`} {...props}>
      {children}
    </div>
  );
};

// PropTypes for all components
Card.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

CardHeader.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

CardTitle.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired, // Make children required
};

CardContent.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

// Default props
Card.defaultProps = {
  className: "",
  children: undefined,
};

CardHeader.defaultProps = {
  className: "",
  children: undefined,
};

CardTitle.defaultProps = {
  className: "",
};

CardContent.defaultProps = {
  className: "",
  children: undefined,
};

export { Card, CardHeader, CardTitle, CardContent };

// Export default object with proper variable assignment
const CardComponents = {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
};

export default CardComponents;
