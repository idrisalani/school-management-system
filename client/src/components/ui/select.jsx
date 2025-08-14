// @ts-check
import React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import PropTypes from "prop-types";

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef(
  (
    /** @type {{ className?: string, children: React.ReactNode, value?: string }} */
    { className = "", children, ...props },
    /** @type {React.ForwardedRef<HTMLButtonElement>} */
    ref
  ) => (
    <SelectPrimitive.Trigger
      ref={ref}
      className={`flex h-10 items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </SelectPrimitive.Trigger>
  )
);

const SelectContent = React.forwardRef(
  (
    /** @type {{ className?: string, children: React.ReactNode, position?: 'popper' | 'item-aligned' }} */
    { className = "", children, position = "popper", ...props },
    /** @type {React.ForwardedRef<HTMLDivElement>} */
    ref
  ) => (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={`relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80 ${className}`}
        position={position}
        {...props}
      >
        <SelectPrimitive.Viewport className="p-1">
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
);

const SelectItem = React.forwardRef(
  (
    /** @type {{ className?: string, children: React.ReactNode, value: string }} */
    { className = "", children, value, ...props },
    /** @type {React.ForwardedRef<HTMLDivElement>} */
    ref
  ) => (
    <SelectPrimitive.Item
      ref={ref}
      value={value}
      className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${className}`}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <span className="h-4 w-4">✓</span>
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
);

SelectTrigger.displayName = "SelectTrigger";
SelectContent.displayName = "SelectContent";
SelectItem.displayName = "SelectItem";

// PropTypes
SelectTrigger.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
  value: PropTypes.string,
};

SelectContent.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
  position: PropTypes.oneOf(["popper", "item-aligned"]),
};

SelectItem.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
  value: PropTypes.string.isRequired,
};

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
};
