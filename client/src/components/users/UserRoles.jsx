// @ts-nocheck

// client/src/components/users/UserRoles.jsx
import React, { useState } from "react";
import {
  Shield,
  Check,
  AlertCircle,
  Search,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const UserRoles = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const roles = [
    {
      id: "admin",
      name: "Administrator",
      description: "Full system access and management",
      users: 5,
      permissions: [
        "User Management",
        "System Settings",
        "Financial Management",
        "Reports & Analytics",
        "All Features Access",
      ],
    },
    {
      id: "teacher",
      name: "Teacher",
      description: "Class and student management",
      users: 45,
      permissions: [
        "Attendance Management",
        "Grade Management",
        "Student Profiles",
        "Course Content",
        "Parent Communication",
      ],
    },
    {
      id: "student",
      name: "Student",
      description: "Limited access to personal information and courses",
      users: 850,
      permissions: [
        "View Grades",
        "View Attendance",
        "Submit Assignments",
        "Access Course Content",
        "Communication with Teachers",
      ],
    },
    {
      id: "parent",
      name: "Parent",
      description: "Access to child's information and progress",
      users: 1200,
      permissions: [
        "View Child's Grades",
        "View Child's Attendance",
        "Teacher Communication",
        "View Reports",
        "Payment Management",
      ],
    },
  ];

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setIsEditing(false);
  };

  const handleEditRole = () => {
    setIsEditing(true);
  };

  const handleSaveRole = () => {
    // Handle save logic here
    setIsEditing(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Roles List */}
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">User Roles</CardTitle>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              <Plus size={20} />
            </button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => handleRoleSelect(role)}
                  className={`w-full flex items-center p-3 rounded-lg text-left transition-colors ${
                    selectedRole?.id === role.id
                      ? "bg-blue-50 border border-blue-200"
                      : "hover:bg-gray-50 border border-transparent"
                  }`}
                >
                  <Shield
                    size={20}
                    className={`${
                      selectedRole?.id === role.id
                        ? "text-blue-500"
                        : "text-gray-400"
                    }`}
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">
                        {role.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        {role.users} users
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {role.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Details */}
      <div className="lg:col-span-2">
        {selectedRole ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
              <div>
                <CardTitle className="text-xl font-medium">
                  {selectedRole.name}
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedRole.description}
                </p>
              </div>
              <div className="flex space-x-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSaveRole}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleEditRole}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <Edit size={20} className="text-gray-500" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <Trash2 size={20} className="text-red-500" />
                    </button>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Permissions Section */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Permissions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedRole.permissions.map((permission, index) => (
                      <div
                        key={index}
                        className={`flex items-center p-3 rounded-lg ${
                          isEditing ? "border border-gray-200" : "bg-gray-50"
                        }`}
                      >
                        {isEditing ? (
                          <input
                            type="checkbox"
                            defaultChecked
                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                        ) : (
                          <Check size={16} className="text-green-500" />
                        )}
                        <span className="ml-3 text-sm text-gray-900">
                          {permission}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Users with this role */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Users with this role ({selectedRole.users})
                  </h3>
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <input
                      type="text"
                      placeholder="Search users..."
                      className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-full"
                    />
                  </div>
                </div>

                {/* Role Settings */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Role Settings
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          Role Hierarchy Level
                        </p>
                        <p className="text-sm text-gray-500">
                          Determines permission inheritance
                        </p>
                      </div>
                      <select
                        disabled={!isEditing}
                        className="border border-gray-200 rounded-lg text-sm p-2"
                        defaultValue="2"
                      >
                        <option value="1">Level 1</option>
                        <option value="2">Level 2</option>
                        <option value="3">Level 3</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          Auto Assignment
                        </p>
                        <p className="text-sm text-gray-500">
                          Automatically assign to new users
                        </p>
                      </div>
                      <button
                        disabled={!isEditing}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                          isEditing ? "cursor-pointer" : "cursor-not-allowed"
                        } ${selectedRole.id === "student" ? "bg-blue-600" : "bg-gray-200"}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                            selectedRole.id === "student"
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Role Selected
              </h3>
              <p className="text-gray-500">
                Select a role from the list to view and manage its details.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UserRoles;
