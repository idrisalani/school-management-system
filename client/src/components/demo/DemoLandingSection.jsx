import React, { useState } from "react";
import { Button } from "../ui/button";
import { RoleSelector } from "./RoleSelector";

// If you're using a different Dialog implementation, you might need to adjust this
const Dialog = ({ children, open, onOpenChange }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={() => onOpenChange(false)}
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        {children}
      </div>
    </div>
  );
};

const DialogTrigger = ({ children, onClick }) => {
  return React.cloneElement(children, { onClick });
};

const DialogContent = ({ children, className = "" }) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-auto ${className}`}
    >
      {children}
    </div>
  );
};

const DialogHeader = ({ children }) => {
  return <div className="p-6 pb-4">{children}</div>;
};

const DialogTitle = ({ children, className = "" }) => {
  return (
    <h2 className={`text-xl font-semibold text-center ${className}`}>
      {children}
    </h2>
  );
};

export const DemoLandingSection = () => {
  console.log("🎯 DemoLandingSection rendering...");
  const [isOpen, setIsOpen] = useState(false);
  console.log("🎯 isOpen state:", isOpen);

  const handleRoleSelect = (role) => {
    console.log("🎯 Role selected:", role);
    setIsOpen(false);
  };

  return (
    <div style={{ border: "2px solid red", padding: "10px" }}>
      {" "}
      {/* Temporary visual debug */}
      <p>DEBUG: DemoLandingSection is rendering!</p>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger onClick={() => setIsOpen(true)}>
          <Button variant="outline" size="lg">
            Live Demo
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose Your Demo Experience</DialogTitle>
            <p className="text-center text-gray-600 mt-2">
              Select a role to explore EduManager with realistic sample data
            </p>
          </DialogHeader>
          <div className="p-6 pt-2">
            <RoleSelector onRoleSelect={handleRoleSelect} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
