// @ts-check
import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";

// SVG ChevronDown icon component
const ChevronDown = ({ className = "", ...props }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

/**
 * Simple Dropdown Menu component
 * @param {object} props - Component properties
 * @param {React.ReactNode} props.trigger - Trigger element content
 * @param {React.ReactNode} props.children - Menu items
 * @param {string} [props.className] - Additional CSS classes
 * @param {'start' | 'center' | 'end'} [props.align] - Content alignment
 * @returns {React.ReactElement} DropdownMenu component
 */
export const DropdownMenu = ({
  trigger,
  children,
  className = "",
  align = "start",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(/** @type {HTMLDivElement | null} */ (null));

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      const target = /** @type {Node} */ (event.target);
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const alignClasses = {
    start: "left-0",
    center: "left-1/2 transform -translate-x-1/2",
    end: "right-0",
  };

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup={true}
        className={`
          inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium 
          transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring 
          focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none
          bg-background border border-input hover:bg-accent hover:text-accent-foreground
          text-foreground shadow-sm ${className}
        `}
      >
        {trigger}
        <ChevronDown
          className={`ml-2 h-4 w-4 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Content */}
      {isOpen && (
        <div
          className={`
            absolute z-50 min-w-[8rem] overflow-hidden rounded-md border 
            bg-popover text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95 
            ${alignClasses[align]}
          `}
          style={{ top: "calc(100% + 4px)" }}
        >
          <div className="p-1" onClick={() => setIsOpen(false)}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Dropdown menu item
 * @param {object} props - Component properties
 * @param {React.ReactNode} props.children - Item content
 * @param {string} [props.className] - Additional CSS classes
 * @param {function} [props.onClick] - Click handler
 * @param {boolean} [props.disabled] - Whether item is disabled
 * @returns {React.ReactElement} DropdownMenuItem component
 */
export const DropdownMenuItem = ({
  children,
  className = "",
  onClick,
  disabled = false,
  ...props
}) => {
  const handleClick = (event) => {
    if (disabled) return;

    if (onClick) {
      onClick(event);
    }
  };

  return (
    <div
      role="menuitem"
      onClick={handleClick}
      className={`
        relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm 
        outline-none transition-colors focus:bg-accent focus:text-accent-foreground 
        ${disabled ? "opacity-50 pointer-events-none" : "hover:bg-accent hover:text-accent-foreground"}
        ${className}
      `}
      data-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick(e);
        }
      }}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Dropdown separator component
 * @param {object} props - Component properties
 * @param {string} [props.className] - Additional CSS classes
 * @returns {React.ReactElement} DropdownMenuSeparator component
 */
export const DropdownMenuSeparator = ({ className = "", ...props }) => (
  <div className={`-mx-1 my-1 h-px bg-muted ${className}`} {...props} />
);

/**
 * Dropdown label component
 * @param {object} props - Component properties
 * @param {React.ReactNode} props.children - Label content
 * @param {string} [props.className] - Additional CSS classes
 * @returns {React.ReactElement} DropdownMenuLabel component
 */
export const DropdownMenuLabel = ({ children, className = "", ...props }) => (
  <div
    className={`px-2 py-1.5 text-sm font-semibold text-foreground ${className}`}
    {...props}
  >
    {children}
  </div>
);

// Legacy exports for compatibility
export const DropdownMenuTrigger = ({ children }) => children;
export const DropdownMenuContent = ({ children }) => children;
export const DropdownMenuShortcut = ({ children, className = "" }) => (
  <span
    className={`ml-auto text-xs tracking-widest text-muted-foreground ${className}`}
  >
    {children}
  </span>
);

// PropTypes
DropdownMenu.propTypes = {
  trigger: PropTypes.node.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  align: PropTypes.oneOf(["start", "center", "end"]),
};

DropdownMenuItem.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
};

DropdownMenuSeparator.propTypes = {
  className: PropTypes.string,
};

DropdownMenuLabel.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

DropdownMenuTrigger.propTypes = {
  children: PropTypes.node,
};

DropdownMenuContent.propTypes = {
  children: PropTypes.node,
};

DropdownMenuShortcut.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

// Export all components as default
const DropdownMenuComponents = {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuShortcut,
};

export default DropdownMenuComponents;
