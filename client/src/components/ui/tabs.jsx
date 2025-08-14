// @ts-check
import React from "react";
import PropTypes from "prop-types";
import * as TabsPrimitive from "@radix-ui/react-tabs";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef(
  (
    /** @type {{ className?: string, children: React.ReactNode }} */
    { className = "", children, ...props },
    /** @type {React.ForwardedRef<HTMLDivElement>} */
    ref
  ) => (
    <TabsPrimitive.List
      ref={ref}
      className={`inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground ${className}`}
      {...props}
    >
      {children}
    </TabsPrimitive.List>
  )
);

const TabsTrigger = React.forwardRef(
  (
    /** @type {{ className?: string, children: React.ReactNode, value: string, disabled?: boolean }} */
    { className = "", children, value, disabled, ...props },
    /** @type {React.ForwardedRef<HTMLButtonElement>} */
    ref
  ) => (
    <TabsPrimitive.Trigger
      ref={ref}
      value={value}
      disabled={disabled}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm ${className}`}
      {...props}
    >
      {children}
    </TabsPrimitive.Trigger>
  )
);

const TabsContent = React.forwardRef(
  (
    /** @type {{ className?: string, children: React.ReactNode, value: string, forceMount?: true }} */
    { className = "", children, value, forceMount, ...props },
    /** @type {React.ForwardedRef<HTMLDivElement>} */
    ref
  ) => (
    <TabsPrimitive.Content
      ref={ref}
      value={value}
      forceMount={forceMount}
      className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}
      {...props}
    >
      {children}
    </TabsPrimitive.Content>
  )
);

TabsList.displayName = "TabsList";
TabsTrigger.displayName = "TabsTrigger";
TabsContent.displayName = "TabsContent";

TabsList.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};

TabsTrigger.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
  value: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
};

TabsContent.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
  value: PropTypes.string.isRequired,
  forceMount: PropTypes.oneOf([true]),
};

export { Tabs, TabsList, TabsTrigger, TabsContent };
