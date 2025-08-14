// @ts-nocheck

// client/src/layout/Sidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  Users,
  BookOpen,
  Calendar,
  FileText,
  Settings,
  CreditCard,
  BarChart2,
  X,
  Book,
  GraduationCap,
} from "lucide-react";

const Sidebar = ({ isOpen, onClose }) => {
  const navigation = [
    { name: "Dashboard", icon: Home, path: "/dashboard" },
    { name: "Students", icon: Users, path: "/students" },
    { name: "Teachers", icon: GraduationCap, path: "/teachers" },
    { name: "Classes", icon: BookOpen, path: "/classes" },
    { name: "Attendance", icon: Calendar, path: "/attendance" },
    { name: "Assignments", icon: FileText, path: "/assignments" },
    { name: "Library", icon: Book, path: "/library" },
    { name: "Payments", icon: CreditCard, path: "/payments" },
    { name: "Reports", icon: BarChart2, path: "/reports" },
    { name: "Settings", icon: Settings, path: "/settings" },
  ];

  const NavItem = ({ item }) => (
    <NavLink
      to={item.path}
      className={({ isActive }) => `
        flex items-center space-x-2 px-4 py-2.5 rounded-lg
        ${
          isActive
            ? "bg-blue-50 text-blue-600"
            : "text-gray-600 hover:bg-gray-100"
        }
      `}
    >
      <item.icon size={20} />
      <span className="font-medium">{item.name}</span>
    </NavLink>
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200
          transform transition-transform duration-200 ease-in-out lg:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo and close button */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center">
            <img src="/assets/logo.svg" alt="Logo" className="h-8 w-auto" />
            <span className="ml-2 text-xl font-bold text-gray-900">
              EduManager
            </span>
          </div>
          <button
            className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </nav>

        {/* User info */}
        <div className="flex items-center p-4 border-t border-gray-200">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
              JD
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">John Doe</p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
