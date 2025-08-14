// @ts-check
import React from "react";
import PropTypes from "prop-types";

/**
 * @typedef {object} ButtonProps
 * @property {React.ReactNode} children - Button content
 * @property {'default' | 'ghost' | 'outline'} [variant] - Button style variant
 * @property {'default' | 'sm' | 'lg'} [size] - Button size
 * @property {string} [className] - Additional CSS classes
 * @property {React.ButtonHTMLAttributes<HTMLButtonElement>['onClick']} [onClick] - Click handler
 * @property {boolean} [disabled] - Whether the button is disabled
 */

/**
 * Button component with different variants and sizes.
 * @param {ButtonProps & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonProps>} props - The component properties including standard button HTML attributes
 * @returns {React.ReactElement} Button component
 */
const Button = ({
  children,
  variant = "default",
  size = "default",
  className = "",
  onClick,
  disabled,
  ...rest
}) => {
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    outline: "border border-input hover:bg-accent hover:text-accent-foreground",
  };

  const sizes = {
    default: "h-10 py-2 px-4",
    sm: "h-9 px-3",
    lg: "h-11 px-8",
  };

  return (
    <button
      className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(["default", "ghost", "outline"]),
  size: PropTypes.oneOf(["default", "sm", "lg"]),
  className: PropTypes.string,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
};

Button.defaultProps = {
  variant: "default",
  size: "default",
  className: "",
  onClick: undefined,
  disabled: false,
};

export default Button;
