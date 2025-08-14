// @ts-nocheck

// client/src/layout/components/MobileNav.jsx
import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  BookOpen,
  Calendar,
  Bell,
  BarChart2,
  Settings,
  Menu,
} from "lucide-react";

const MobileNav = ({ visible = true }) => {
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);

  // Primary navigation items
  const primaryNavItems = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: Users, label: "Students", path: "/students" },
    { icon: BookOpen, label: "Classes", path: "/classes" },
    { icon: Calendar, label: "Schedule", path: "/schedule" },
  ];

  // Secondary navigation items (shown in more menu)
  const secondaryNavItems = [
    { icon: Bell, label: "Notifications", path: "/notifications" },
    { icon: BarChart2, label: "Reports", path: "/reports" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  // Close more menu when route changes
  useEffect(() => {
    setShowMore(false);
  }, [location]);

  // Navigation item component
  const NavItem = ({ item, onClick }) => (
    <NavLink
      to={item.path}
      onClick={onClick}
      className={({ isActive }) => `
        flex flex-col items-center justify-center py-2 px-4
        ${isActive ? "text-blue-600" : "text-gray-600 hover:text-gray-900"}
      `}
    >
      <item.icon size={20} strokeWidth={1.5} />
      <span className="text-xs mt-1">{item.label}</span>
    </NavLink>
  );

  if (!visible) return null;

  return (
    <>
      {/* More menu overlay */}
      {showMore && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* Bottom navigation bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 sm:hidden z-50">
        {/* Primary navigation */}
        <nav className="flex justify-around">
          {primaryNavItems.map((item) => (
            <NavItem key={item.label} item={item} />
          ))}

          {/* More button */}
          <button
            onClick={() => setShowMore(!showMore)}
            className={`
              flex flex-col items-center justify-center py-2 px-4
              ${showMore ? "text-blue-600" : "text-gray-600"}
            `}
          >
            <Menu size={20} strokeWidth={1.5} />
            <span className="text-xs mt-1">More</span>
          </button>
        </nav>

        {/* More menu */}
        {showMore && (
          <div className="absolute bottom-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg rounded-t-xl overflow-hidden">
            <div className="py-2">
              {secondaryNavItems.map((item) => (
                <NavItem
                  key={item.label}
                  item={item}
                  onClick={() => setShowMore(false)}
                />
              ))}
            </div>

            {/* Close button */}
            <button
              onClick={() => setShowMore(false)}
              className="w-full p-4 text-center text-gray-600 border-t border-gray-200 text-sm"
            >
              Close Menu
            </button>
          </div>
        )}
      </div>

      {/* Bottom spacing to prevent content from being hidden behind nav */}
      <div className="h-16 sm:h-0" />
    </>
  );
};

export default MobileNav;
