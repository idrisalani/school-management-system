// @ts-nocheck

// client/src/components/demo/DemoModeIndicator.jsx
import React from "react";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Info, X, RefreshCw } from "lucide-react";
import { useDemo } from "../../contexts/DemoContext";

export const DemoModeIndicator = () => {
  const { isDemoMode, exitDemoMode, resetDemoData, getDemoMessage } = useDemo(); // Removed unused 'demoUser' variable

  if (!isDemoMode) return null;

  return (
    <Alert className="mb-4 border-blue-500 bg-blue-50">
      <Info className="h-4 w-4 text-blue-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Demo Mode
          </Badge>
          <span className="text-sm text-blue-800">{getDemoMessage()}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetDemoData}
            className="text-blue-600 border-blue-300"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Reset Demo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exitDemoMode}
            className="text-blue-600 border-blue-300"
          >
            <X className="h-3 w-3 mr-1" />
            Exit Demo
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};
