// @ts-nocheck

// client/src/components/common/Select.jsx
import React, { forwardRef } from "react";
import { ChevronDown, AlertCircle } from "lucide-react";

const Select = forwardRef(
  (
    {
      label,
      options = [],
      error,
      helperText,
      className = "",
      required = false,
      disabled = false,
      placeholder = "Select an option",
      ...props
    },
    ref
  ) => {
    const selectClasses = `
    w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-10 text-gray-900
    focus:outline-none focus:ring-2 focus:ring-blue-500
    disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500
    ${error ? "border-red-500" : "border-gray-300"}
    ${className}
  `;

    return (
      <div className="w-full">
        {label && (
          <label className="mb-1.5 block text-sm font-medium text-gray-900">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            disabled={disabled}
            className={selectClasses}
            {...props}
          >
            <option value="">{placeholder}</option>
            {options.map((option, index) => (
              <option key={index} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
            <ChevronDown size={18} />
          </div>

          {error && (
            <div className="absolute right-8 top-1/2 -translate-y-1/2 text-red-500">
              <AlertCircle size={18} />
            </div>
          )}
        </div>

        {(helperText || error) && (
          <p
            className={`mt-1 text-sm ${error ? "text-red-500" : "text-gray-500"}`}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
export default Select;
