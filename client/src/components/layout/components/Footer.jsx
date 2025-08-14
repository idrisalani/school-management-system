// @ts-nocheck

// client/src/layout/Footer.jsx
import React from "react";
import { Heart } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    { label: "About", href: "/about" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4 md:py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Copyright */}
            <div className="text-center md:text-left text-sm text-gray-500">
              <p>© {currentYear} EduManager. All rights reserved.</p>
            </div>

            {/* Links */}
            <div className="flex items-center justify-center space-x-4">
              {footerLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Made with love */}
            <div className="text-center md:text-right text-sm text-gray-500">
              <p className="flex items-center justify-center md:justify-end space-x-1">
                <span>Made with</span>
                <Heart size={16} className="text-red-500" />
                <span>by EduManager Team</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
