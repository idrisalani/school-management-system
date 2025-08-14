// @ts-nocheck
import React from "react";
import PropTypes from "prop-types";
import { AlertCircle, CheckCircle2, XCircle, Info } from "lucide-react";

const variants = {
  default: "bg-background text-foreground border-border",
  destructive: "bg-red-50 text-red-800 border-red-200",
  success: "bg-green-50 text-green-800 border-green-200",
  warning: "bg-yellow-50 text-yellow-800 border-yellow-200",
  info: "bg-blue-50 text-blue-800 border-blue-200",
};

// Icon mapping for each variant
const variantIcons = {
  default: Info,
  destructive: XCircle,
  success: CheckCircle2,
  warning: AlertCircle,
  info: Info,
};

/**
 * Alert component for various notifications
 * @param {object} props - Component properties
 * @param {string} [props.className] - Additional CSS classes
 * @param {string} [props.variant] - Alert variant style
 * @param {React.ReactNode} props.children - Alert content
 * @param {boolean} [props.showIcon] - Whether to show the variant icon
 * @returns {React.ReactElement} Alert component
 */
const Alert = ({
  className = "",
  variant = "default",
  children,
  showIcon = true,
  ...props
}) => {
  const IconComponent = variantIcons[variant] || variantIcons.default;

  return (
    <div
      role="alert"
      className={`relative w-full rounded-lg border p-4 ${
        showIcon
          ? "[&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg+div]:translate-y-[-3px] [&:has(svg)]:pl-11"
          : ""
      } ${variants[variant]} ${className}`}
      {...props}
    >
      {showIcon && <IconComponent className="h-4 w-4" />}
      {children}
    </div>
  );
};

/**
 * Alert title component
 * @param {object} props - Component properties
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.ReactNode} props.children - Title content
 * @returns {React.ReactElement} Alert title component
 */
const AlertTitle = ({ className = "", children, ...props }) => (
  <h5
    className={`mb-1 font-medium leading-none tracking-tight ${className}`}
    {...props}
  >
    {children}
  </h5>
);

/**
 * Alert description component
 * @param {object} props - Component properties
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.ReactNode} props.children - Description content
 * @returns {React.ReactElement} Alert description component
 */
const AlertDescription = ({ className = "", children, ...props }) => (
  <div className={`text-sm [&_p]:leading-relaxed ${className}`} {...props}>
    {children}
  </div>
);

Alert.propTypes = {
  className: PropTypes.string,
  variant: PropTypes.oneOf([
    "default",
    "destructive",
    "success",
    "warning",
    "info",
  ]),
  children: PropTypes.node.isRequired,
  showIcon: PropTypes.bool,
};

AlertTitle.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};

AlertDescription.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export { Alert, AlertTitle, AlertDescription };
