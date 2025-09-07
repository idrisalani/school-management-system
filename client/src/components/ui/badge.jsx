// @ts-check
import React from "react";
import PropTypes from "prop-types";

const variants = {
  default: "bg-primary text-primary-foreground hover:bg-primary/80",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  destructive:
    "bg-destructive text-destructive-foreground hover:bg-destructive/80",
  outline: "text-foreground border border-input",
  success: "bg-green-100 text-green-800 hover:bg-green-200",
  warning: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
};

/**
 * Badge component for status and labels
 * @param {object} props - Component properties
 * @param {string} [props.className] - Additional CSS classes
 * @param {'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'} [props.variant] - Badge variant
 * @param {React.ReactNode} props.children - Badge content
 * @returns {React.ReactElement} Badge component
 */
const Badge = ({ className = "", variant = "default", children, ...props }) => {
  return (
    <div
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

Badge.propTypes = {
  className: PropTypes.string,
  variant: PropTypes.oneOf([
    "default",
    "secondary",
    "destructive",
    "outline",
    "success",
    "warning",
  ]),
  children: PropTypes.node.isRequired,
};

Badge.defaultProps = {
  className: "",
  variant: "default",
};

export { Badge };
export default Badge;
