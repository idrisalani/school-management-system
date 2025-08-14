// @ts-nocheck

// client/src/layout/variations/SimpleLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

const SimpleLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header minimal />

      <main className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Outlet />
        </div>
      </main>

      <Footer minimal />
    </div>
  );
};

export default SimpleLayout;
