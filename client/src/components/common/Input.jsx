// @ts-nocheck

// client/src/components/common/Input.jsx
import React, { forwardRef } from "react";
import { AlertCircle } from "lucide-react";

const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      startIcon,
      endIcon,
      type = "text",
      className = "",
      required = false,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const inputClasses = `
    w-full rounded-lg border px-4 py-2.5 text-gray-900 placeholder:text-gray-500
    focus:outline-none focus:ring-2 focus:ring-blue-500
    disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500
    ${error ? "border-red-500" : "border-gray-300"}
    ${startIcon ? "pl-10" : ""}
    ${endIcon ? "pr-10" : ""}
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
          {startIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              {startIcon}
            </div>
          )}

          <input
            ref={ref}
            type={type}
            disabled={disabled}
            className={inputClasses}
            {...props}
          />

          {endIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
              {endIcon}
            </div>
          )}

          {error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
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

Input.displayName = "Input";
export default Input;
