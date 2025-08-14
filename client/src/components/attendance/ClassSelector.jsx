// @ts-nocheck

// client/src/components/attendance/ClassSelector.jsx
import React, { useState } from "react";
import { Users, ChevronDown, Search } from "lucide-react";

const ClassSelector = ({ selectedClass, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const classes = [
    { id: "all", name: "All Classes", students: 150 },
    { id: "10a", name: "Class 10-A", students: 32 },
    { id: "10b", name: "Class 10-B", students: 30 },
    { id: "11a", name: "Class 11-A", students: 28 },
    { id: "11b", name: "Class 11-B", students: 31 },
    { id: "12a", name: "Class 12-A", students: 29 },
  ];

  const filteredClasses = classes.filter((classItem) =>
    classItem.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedClassInfo =
    classes.find((c) => c.id === selectedClass) || classes[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
      >
        <Users size={18} className="text-gray-400" />
        <span>{selectedClassInfo.name}</span>
        <ChevronDown size={16} className="text-gray-400" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute mt-2 w-72 bg-white rounded-lg shadow-lg z-20 border border-gray-200">
            {/* Search */}
            <div className="p-2 border-b border-gray-200">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search classes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Class list */}
            <div className="max-h-60 overflow-y-auto">
              {filteredClasses.map((classItem) => (
                <button
                  key={classItem.id}
                  onClick={() => {
                    onChange(classItem.id);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between
                    ${selectedClass === classItem.id ? "bg-blue-50 text-blue-600" : "text-gray-700"}
                  `}
                >
                  <div className="flex items-center space-x-2">
                    <span>{classItem.name}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {classItem.students} students
                  </span>
                </button>
              ))}
            </div>

            {filteredClasses.length === 0 && (
              <div className="p-4 text-center text-sm text-gray-500">
                No classes found
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ClassSelector;
