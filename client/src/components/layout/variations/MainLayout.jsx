// @ts-nocheck
import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import Breadcrumbs from "../components/Breadcrumbs";
import MobileNav from "../components/MobileNav";

/**
 * Main layout component with navigation and sidebar.
 * @param {object} props - Component props
 * @param {React.ReactNode} [props.children] - Optional child components to render instead of Outlet
 * @returns {React.ReactElement} Main layout component
 */
const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileNav visible={scrolled} />

      <div className="flex">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isCompact={isCompact}
        />

        <div
          className={`
          flex-1 flex flex-col min-h-screen
          ${isCompact ? "lg:pl-20" : "lg:pl-64"}
          transition-all duration-300
        `}
        >
          <Header
            onMenuClick={() => setSidebarOpen(true)}
            onToggleCompact={() => setIsCompact(!isCompact)}
            scrolled={scrolled}
          />

          <div className="flex-1 px-4 sm:px-6 lg:px-8">
            <div className="py-4 hidden sm:block">
              <Breadcrumbs />
            </div>

            <main className="max-w-7xl mx-auto pb-6">
              {children || <Outlet />}
            </main>
          </div>

          <Footer />
        </div>
      </div>
    </div>
  );
};

MainLayout.propTypes = {
  children: PropTypes.node,
};

export default MainLayout;
