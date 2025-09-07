import React from "react";

// SVG ChevronDown icon for Select
const ChevronDownIcon = ({ className = "" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

// Main Select component
export const Select = React.forwardRef(
  (
    {
      className = "",
      disabled = false,
      placeholder = "Select an option",
      value,
      onChange,
      children,
      ...props
    },
    ref
  ) => {
    const selectClasses = `
    flex h-10 w-full items-center justify-between rounded-md border border-gray-300 
    bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none 
    focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed 
    disabled:opacity-50 appearance-none
    ${className}
  `.trim();

    return (
      <div className="relative">
        <select
          ref={ref}
          className={selectClasses}
          disabled={disabled}
          value={value}
          onChange={onChange}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {children}
        </select>
        <ChevronDownIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
    );
  }
);

Select.displayName = "Select";

// Select Option component
export const SelectOption = React.forwardRef(
  ({ className = "", value, disabled = false, children, ...props }, ref) => {
    const optionClasses = `
    ${className}
  `.trim();

    return (
      <option
        ref={ref}
        className={optionClasses}
        value={value}
        disabled={disabled}
        {...props}
      >
        {children}
      </option>
    );
  }
);

SelectOption.displayName = "SelectOption";

// Export all components
export default {
  Select,
  SelectOption,
};
