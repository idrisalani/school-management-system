// @ts-nocheck

// client/src/components/demo/RoleSelector.jsx - Alternative Icons Version
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Shield, User, Book, Users } from "lucide-react";
import { useDemo } from "../../contexts/DemoContext";

export const RoleSelector = ({ onRoleSelect }) => {
  const { enterDemoMode, availableRoles } = useDemo();

  const roleConfig = {
    admin: {
      icon: Shield, // Alternative: Settings, Crown, Key
      title: "School Administrator",
      description:
        "Manage the entire school system with comprehensive analytics and controls",
      features: [
        "School-wide analytics",
        "User management",
        "Financial reporting",
        "System settings",
      ],
      color: "bg-purple-500",
    },
    teacher: {
      icon: User, // Alternative: BookOpen, Presentation, Monitor
      title: "Teacher",
      description:
        "Manage classes, create assignments, and track student progress",
      features: [
        "Assignment creation",
        "Grade management",
        "Class analytics",
        "Student progress",
      ],
      color: "bg-green-500",
    },
    student: {
      icon: Book, // Alternative: BookOpen, Backpack, PenTool
      title: "Student",
      description:
        "View assignments, check grades, and track academic progress",
      features: [
        "Assignment submissions",
        "Grade tracking",
        "Attendance view",
        "Academic progress",
      ],
      color: "bg-blue-500",
    },
    parent: {
      icon: Users, // Alternative: Heart, Eye, Home
      title: "Parent",
      description:
        "Monitor your children's academic progress and school activities",
      features: [
        "Children overview",
        "Grade monitoring",
        "Attendance tracking",
        "Communication",
      ],
      color: "bg-orange-500",
    },
  };

  const handleRoleSelect = (role) => {
    if (onRoleSelect) {
      onRoleSelect(role);
    } else {
      enterDemoMode(role);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {availableRoles.map((role) => {
        const config = roleConfig[role];
        const Icon = config.icon;

        return (
          <Card
            key={role}
            className="hover:shadow-lg transition-shadow cursor-pointer"
          >
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${config.color} text-white`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">{config.title}</CardTitle>
                  <Badge variant="outline" className="mt-1">
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{config.description}</p>

              <div className="space-y-2 mb-4">
                <p className="text-sm font-medium text-gray-700">
                  Key Features:
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {config.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <Button className="w-full" onClick={() => handleRoleSelect(role)}>
                Try {config.title} Demo
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
