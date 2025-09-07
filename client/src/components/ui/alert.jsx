// @ts-check
import React from "react";
import PropTypes from "prop-types";

// Alert variants
const alertVariants = {
  default: "bg-background text-foreground border",
  destructive:
    "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
  warning:
    "border-yellow-500/50 text-yellow-800 dark:border-yellow-500 [&>svg]:text-yellow-600",
  success:
    "border-green-500/50 text-green-800 dark:border-green-500 [&>svg]:text-green-600",
};

/**
 * Alert component for displaying important messages
 * @param {object} props - Component properties
 * @param {React.ReactNode} props.children - Alert content
 * @param {string} [props.className] - Additional CSS classes
 * @param {'default' | 'destructive' | 'warning' | 'success'} [props.variant] - Alert variant
 * @returns {React.ReactElement} Alert component
 */
export const Alert = React.forwardRef(
  /**
   * @param {{ children: React.ReactNode, className?: string, variant?: 'default' | 'destructive' | 'warning' | 'success' }} props
   * @param {React.ForwardedRef<HTMLDivElement>} ref
   */
  ({ children, className = "", variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="alert"
        className={`relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground ${alertVariants[variant]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Alert.displayName = "Alert";

/**
 * Alert title component
 * @param {object} props - Component properties
 * @param {React.ReactNode} props.children - Title content
 * @param {string} [props.className] - Additional CSS classes
 * @returns {React.ReactElement} AlertTitle component
 */
export const AlertTitle = React.forwardRef(
  /**
   * @param {{ children: React.ReactNode, className?: string }} props
   * @param {React.ForwardedRef<HTMLHeadingElement>} ref
   */
  ({ children, className = "", ...props }, ref) => (
    <h5
      ref={ref}
      className={`mb-1 font-medium leading-none tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h5>
  )
);

AlertTitle.displayName = "AlertTitle";

/**
 * Alert description component
 * @param {object} props - Component properties
 * @param {React.ReactNode} props.children - Description content
 * @param {string} [props.className] - Additional CSS classes
 * @returns {React.ReactElement} AlertDescription component
 */
export const AlertDescription = React.forwardRef(
  /**
   * @param {{ children: React.ReactNode, className?: string }} props
   * @param {React.ForwardedRef<HTMLDivElement>} ref
   */
  ({ children, className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`text-sm [&_p]:leading-relaxed ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);

AlertDescription.displayName = "AlertDescription";

// PropTypes
Alert.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  variant: PropTypes.oneOf(["default", "destructive", "warning", "success"]),
};

AlertTitle.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

AlertDescription.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

// Export default object with proper variable assignment
const AlertComponents = {
  Alert,
  AlertTitle,
  AlertDescription,
};

export default AlertComponents;
