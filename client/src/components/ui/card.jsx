import React from "react";
import PropTypes from "prop-types";

const Card = ({ className = "", ...props }) => {
  return (
    <div
      className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}
      {...props}
    />
  );
};

const CardHeader = ({ className = "", ...props }) => {
  return (
    <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props} />
  );
};

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

const CardContent = ({ className = "", ...props }) => {
  return <div className={`p-6 pt-0 ${className}`} {...props} />;
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
};

CardHeader.defaultProps = {
  className: "",
};

CardTitle.defaultProps = {
  className: "",
};

CardContent.defaultProps = {
  className: "",
};

export { Card, CardHeader, CardTitle, CardContent };