// @ts-check
import React from "react";
import PropTypes from "prop-types";

/**
 * Input component with styling
 * @param {object} props - Component properties
 * @param {string} [props.className] - Additional CSS classes
 * @param {string} [props.type] - Input type
 * @returns {React.ReactElement} Input component
 */
const Input = React.forwardRef(
  /**
   * @param {{ className?: string, type?: string }} props
   * @param {React.ForwardedRef<HTMLInputElement>} ref
   */
  (props, ref) => {
    const { className = "", type = "text", ...restProps } = props;

    return (
      <input
        type={type}
        className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        ref={ref}
        {...restProps}
      />
    );
  }
);

Input.displayName = "Input";

Input.propTypes = {
  className: PropTypes.string,
  type: PropTypes.string,
};

export { Input };
export default Input;
