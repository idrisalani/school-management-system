// @ts-nocheck

// client/src/components/attendance/AttendanceManager.jsx
import React, { useState } from "react";
import { Calendar, Download, Clock, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AttendanceGrid from "./AttendanceGrid";
import AttendanceSummary from "./AttendanceSummary";
import DateSelector from "./DateSelector";
import ClassSelector from "./ClassSelector";

const AttendanceManager = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedClass, setSelectedClass] = useState("all");
  const [view, setView] = useState("daily"); // daily, weekly, monthly

  const viewOptions = [
    { value: "daily", label: "Daily View" },
    { value: "weekly", label: "Weekly View" },
    { value: "monthly", label: "Monthly View" },
  ];

  const handleAttendanceUpdate = (studentId, status) => {
    // Handle attendance update logic
    console.log("Updating attendance:", { studentId, status });
  };

  const handleExport = (format) => {
    // Handle export logic
    console.log("Exporting attendance in format:", format);
  };

  return (
    <div className="space-y-6">
      {/* Controls Section */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <DateSelector
            selectedDate={selectedDate}
            onChange={setSelectedDate}
            view={view}
          />
          <ClassSelector
            selectedClass={selectedClass}
            onChange={setSelectedClass}
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={view}
            onChange={(e) => setView(e.target.value)}
            className="border-gray-200 rounded-lg text-sm"
          >
            {viewOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => handleExport("pdf")}
            className="inline-flex items-center px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92%</div>
            <p className="text-xs text-gray-500">28/30 students</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
            <Clock className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-gray-500">6.7% of class</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Attendance
            </CardTitle>
            <Calendar className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <p className="text-xs text-gray-500">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Attendance Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Register</CardTitle>
        </CardHeader>
        <CardContent>
          <AttendanceGrid
            date={selectedDate}
            classId={selectedClass}
            view={view}
            onUpdate={handleAttendanceUpdate}
          />
        </CardContent>
      </Card>

      {/* Summary Section */}
      <AttendanceSummary
        date={selectedDate}
        classId={selectedClass}
        view={view}
      />
    </div>
  );
};

export default AttendanceManager;
