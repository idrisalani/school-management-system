// @ts-nocheck
import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
} from "react";

// SVG ChevronDown icon component (since lucide-react import is having issues)
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

// Context for dropdown state management
const DropdownContext = createContext({
  isOpen: false,
  toggleDropdown: () => {},
  closeDropdown: () => {},
});

// Main DropdownMenu component (container)
export const DropdownMenu = ({ children, onOpenChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Toggle dropdown state
  const toggleDropdown = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (onOpenChange) {
      onOpenChange(newState);
    }
  };

  // Close dropdown
  const closeDropdown = () => {
    setIsOpen(false);
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        dropdownRef.current.contains &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        if (onOpenChange) {
          onOpenChange(false);
        }
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        if (onOpenChange) {
          onOpenChange(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onOpenChange]);

  return (
    <DropdownContext.Provider value={{ isOpen, toggleDropdown, closeDropdown }}>
      <div ref={dropdownRef} className="relative inline-block text-left">
        {children}
      </div>
    </DropdownContext.Provider>
  );
};

// Dropdown trigger component
export const DropdownMenuTrigger = ({
  children,
  className = "",
  asChild = false,
  ...props
}) => {
  const { toggleDropdown, isOpen } = useContext(DropdownContext);

  const triggerClasses = `
    inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium 
    transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 
    focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none
    ${className}
  `.trim();

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: toggleDropdown,
      "aria-expanded": isOpen,
      "aria-haspopup": true,
      className: `${children.props.className || ""} ${triggerClasses}`.trim(),
      ...props,
    });
  }

  return (
    <button
      type="button"
      onClick={toggleDropdown}
      aria-expanded={isOpen}
      aria-haspopup={true}
      className={`
        ${triggerClasses}
        bg-white border border-gray-300 hover:bg-gray-50
        text-gray-700 shadow-sm
      `}
      {...props}
    >
      {children}
      <ChevronDown
        className={`ml-2 h-4 w-4 transition-transform duration-200 ${
          isOpen ? "rotate-180" : ""
        }`}
      />
    </button>
  );
};

// Dropdown content container
export const DropdownMenuContent = ({
  children,
  className = "",
  align = "start",
  sideOffset = 4,
  ...props
}) => {
  const { isOpen } = useContext(DropdownContext);

  if (!isOpen) return null;

  const alignClasses = {
    start: "left-0",
    center: "left-1/2 transform -translate-x-1/2",
    end: "right-0",
  };

  return (
    <div
      className={`
        absolute z-50 min-w-[8rem] overflow-hidden rounded-md border 
        bg-white shadow-lg animate-in fade-in-0 zoom-in-95 
        ${alignClasses[align]}
        ${className}
      `}
      style={{ top: `calc(100% + ${sideOffset}px)` }}
      {...props}
    >
      <div className="p-1">{children}</div>
    </div>
  );
};

// Individual dropdown menu item
export const DropdownMenuItem = ({
  children,
  className = "",
  onClick,
  disabled = false,
  asChild = false,
  ...props
}) => {
  const { closeDropdown } = useContext(DropdownContext);

  const handleClick = (event) => {
    if (disabled) return;

    if (onClick) {
      onClick(event);
    }
    closeDropdown();
  };

  const itemClasses = `
    relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm 
    outline-none transition-colors focus:bg-gray-100 focus:text-gray-900 
    data-[disabled]:pointer-events-none data-[disabled]:opacity-50
    ${disabled ? "opacity-50 pointer-events-none" : "hover:bg-gray-100"}
    ${className}
  `.trim();

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: handleClick,
      className: `${children.props.className || ""} ${itemClasses}`.trim(),
      "data-disabled": disabled,
      ...props,
    });
  }

  return (
    <div
      role="menuitem"
      onClick={handleClick}
      className={itemClasses}
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

// Dropdown separator component
export const DropdownMenuSeparator = ({ className = "", ...props }) => (
  <div className={`-mx-1 my-1 h-px bg-gray-200 ${className}`} {...props} />
);

// Dropdown label component
export const DropdownMenuLabel = ({ children, className = "", ...props }) => (
  <div
    className={`px-2 py-1.5 text-sm font-semibold text-gray-900 ${className}`}
    {...props}
  >
    {children}
  </div>
);

// Dropdown sub-menu trigger (for nested menus)
export const DropdownMenuSubTrigger = ({
  children,
  className = "",
  ...props
}) => (
  <div
    className={`
      flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm 
      outline-none focus:bg-gray-100 hover:bg-gray-100
      ${className}
    `}
    {...props}
  >
    {children}
    <ChevronDown className="ml-auto h-4 w-4 rotate-[-90deg]" />
  </div>
);

// Shortcut text component
export const DropdownMenuShortcut = ({
  children,
  className = "",
  ...props
}) => (
  <span
    className={`ml-auto text-xs tracking-widest text-gray-500 ${className}`}
    {...props}
  >
    {children}
  </span>
);

// Export all components as default
const DropdownMenuComponents = {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSubTrigger,
  DropdownMenuShortcut,
};

export default DropdownMenuComponents;
