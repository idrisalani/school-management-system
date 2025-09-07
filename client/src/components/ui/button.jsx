// @ts-check
import React from "react";
import PropTypes from "prop-types";

/**
 * @typedef {object} ButtonProps
 * @property {React.ReactNode} children - Button content
 * @property {'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'} [variant] - Button style variant
 * @property {'default' | 'sm' | 'lg' | 'icon'} [size] - Button size
 * @property {string} [className] - Additional CSS classes
 * @property {React.ButtonHTMLAttributes<HTMLButtonElement>['onClick']} [onClick] - Click handler
 * @property {boolean} [disabled] - Whether the button is disabled
 * @property {string} [type] - Button type
 */

/**
 * Button component with different variants and sizes.
 * @param {ButtonProps & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonProps>} props - The component properties including standard button HTML attributes
 * @returns {React.ReactElement} Button component
 */
const Button = React.forwardRef(
  /**
   * @param {{ children: React.ReactNode, variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link', size?: 'default' | 'sm' | 'lg' | 'icon', className?: string, onClick?: React.MouseEventHandler<HTMLButtonElement>, disabled?: boolean, type?: 'button' | 'submit' | 'reset' }} props
   * @param {React.ForwardedRef<HTMLButtonElement>} ref
   */
  (
    {
      children,
      variant = "default",
      size = "default",
      className = "",
      onClick,
      disabled = false,
      type = "button",
      ...rest
    },
    ref
  ) => {
    const variants = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      destructive:
        "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      outline:
        "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "text-primary underline-offset-4 hover:underline",
    };

    const sizes = {
      default: "h-10 py-2 px-4",
      sm: "h-9 px-3",
      lg: "h-11 px-8",
      icon: "h-10 w-10",
    };

    return (
      <button
        ref={ref}
        type={type}
        className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
        onClick={onClick}
        disabled={disabled}
        {...rest}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf([
    "default",
    "destructive",
    "outline",
    "secondary",
    "ghost",
    "link",
  ]),
  size: PropTypes.oneOf(["default", "sm", "lg", "icon"]),
  className: PropTypes.string,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  type: PropTypes.string,
};

export { Button };
export default Button;
