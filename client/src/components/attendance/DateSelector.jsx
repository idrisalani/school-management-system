// @ts-nocheck

// client/src/components/attendance/DateSelector.jsx
import React from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

const DateSelector = ({ selectedDate, onChange, view = "daily" }) => {
  const formatDate = (date) => {
    if (view === "daily") {
      return new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(date);
    } else if (view === "weekly") {
      const endDate = new Date(date);
      endDate.setDate(date.getDate() + 6);
      return `Week of ${date.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    } else {
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
      }).format(date);
    }
  };

  const handlePrevious = () => {
    const newDate = new Date(selectedDate);
    if (view === "daily") {
      newDate.setDate(selectedDate.getDate() - 1);
    } else if (view === "weekly") {
      newDate.setDate(selectedDate.getDate() - 7);
    } else {
      newDate.setMonth(selectedDate.getMonth() - 1);
    }
    onChange(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(selectedDate);
    if (view === "daily") {
      newDate.setDate(selectedDate.getDate() + 1);
    } else if (view === "weekly") {
      newDate.setDate(selectedDate.getDate() + 7);
    } else {
      newDate.setMonth(selectedDate.getMonth() + 1);
    }
    onChange(newDate);
  };

  return (
    <div className="flex items-center space-x-4">
      <Calendar className="text-gray-400" size={20} />
      <div className="flex items-center space-x-2">
        <button
          onClick={handlePrevious}
          className="p-1 rounded-full hover:bg-gray-100"
        >
          <ChevronLeft size={20} className="text-gray-500" />
        </button>

        <div className="flex items-center space-x-2">
          <input
            type="date"
            value={selectedDate.toISOString().split("T")[0]}
            onChange={(e) => onChange(new Date(e.target.value))}
            className="border-gray-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="text-sm text-gray-600 hidden md:inline">
            {formatDate(selectedDate)}
          </span>
        </div>

        <button
          onClick={handleNext}
          className="p-1 rounded-full hover:bg-gray-100"
        >
          <ChevronRight size={20} className="text-gray-500" />
        </button>
      </div>
    </div>
  );
};

export default DateSelector;
