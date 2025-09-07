// @ts-check
import React from "react";
import PropTypes from "prop-types";

/**
 * Textarea component with styling
 * @param {object} props - Component properties
 * @param {string} [props.className] - Additional CSS classes
 * @param {string} [props.placeholder] - Placeholder text
 * @param {number} [props.rows] - Number of rows
 * @returns {React.ReactElement} Textarea component
 */
const Textarea = React.forwardRef(
  /**
   * @param {{ className?: string, placeholder?: string, rows?: number }} props
   * @param {React.ForwardedRef<HTMLTextAreaElement>} ref
   */
  (props, ref) => {
    const { className = "", placeholder, rows = 3, ...restProps } = props;

    return (
      <textarea
        className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        placeholder={placeholder}
        rows={rows}
        ref={ref}
        {...restProps}
      />
    );
  }
);

Textarea.displayName = "Textarea";

Textarea.propTypes = {
  className: PropTypes.string,
  placeholder: PropTypes.string,
  rows: PropTypes.number,
};

export { Textarea };
export default Textarea;
