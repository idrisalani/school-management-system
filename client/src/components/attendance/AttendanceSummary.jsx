// @ts-nocheck

// client/src/components/attendance/AttendanceSummary.jsx
import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, TrendingUp } from "lucide-react";

// Sample data for different classes - would come from API
const attendanceDataByClass = {
  "10A": [
    { date: "Mon", present: 28, absent: 2, late: 1 },
    { date: "Tue", present: 27, absent: 3, late: 2 },
    { date: "Wed", present: 29, absent: 1, late: 1 },
    { date: "Thu", present: 26, absent: 4, late: 2 },
    { date: "Fri", present: 28, absent: 2, late: 1 },
  ],
  "10B": [
    { date: "Mon", present: 25, absent: 4, late: 2 },
    { date: "Tue", present: 26, absent: 3, late: 2 },
    { date: "Wed", present: 28, absent: 2, late: 1 },
    { date: "Thu", present: 24, absent: 5, late: 2 },
    { date: "Fri", present: 27, absent: 3, late: 1 },
  ],
  all: [
    { date: "Mon", present: 53, absent: 6, late: 3 },
    { date: "Tue", present: 53, absent: 6, late: 4 },
    { date: "Wed", present: 57, absent: 3, late: 2 },
    { date: "Thu", present: 50, absent: 9, late: 4 },
    { date: "Fri", present: 55, absent: 5, late: 2 },
  ],
};

/**
 * Attendance Summary component showing attendance overview
 * @param {object} props - Component props
 * @param {string} props.date - Selected date or date range
 * @param {string} props.classId - Selected class ID
 * @param {string} props.view - View mode (chart, stats, pie)
 * @returns {React.ReactElement} Attendance Summary component
 */
const AttendanceSummary = ({ date, classId = "all", view = "chart" }) => {
  // Get summary data based on selected class
  const summaryData = useMemo(() => {
    return attendanceDataByClass[classId] || attendanceDataByClass["all"];
  }, [classId]);

  // Calculate summary statistics
  const stats = useMemo(() => {
    const totals = summaryData.reduce(
      (acc, day) => ({
        present: acc.present + day.present,
        absent: acc.absent + day.absent,
        late: acc.late + day.late,
      }),
      { present: 0, absent: 0, late: 0 }
    );

    const totalStudents = totals.present + totals.absent + totals.late;
    const averageAttendance =
      totalStudents > 0
        ? Math.round((totals.present / totalStudents) * 100)
        : 0;

    // Find day with most absences
    const dayWithMostAbsences = summaryData.reduce((prev, current) =>
      prev.absent > current.absent ? prev : current
    );

    // Calculate perfect attendance (mock calculation)
    const perfectAttendance = Math.round(totals.present * 0.8); // Mock calculation

    return {
      averageAttendance,
      mostAbsencesDay: dayWithMostAbsences.date,
      perfectAttendance,
      totals,
    };
  }, [summaryData]);

  // Format date for display
  const formatDateRange = (dateInput) => {
    if (!dateInput) return "This Week";
    if (typeof dateInput === "string") {
      const date = new Date(dateInput);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    return dateInput;
  };

  // Pie chart data for current view
  const pieData = useMemo(
    () => [
      { name: "Present", value: stats.totals.present, color: "#10B981" },
      { name: "Absent", value: stats.totals.absent, color: "#EF4444" },
      { name: "Late", value: stats.totals.late, color: "#F59E0B" },
    ],
    [stats.totals]
  );

  /**
   * Custom tooltip component for charts
   * @param {object} props - Tooltip props
   * @param {boolean} props.active - Whether tooltip is active
   * @param {Array} props.payload - Data payload for tooltip
   * @param {string} props.label - Label for the data point
   * @returns {React.ReactElement|null} Custom tooltip component
   */
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-sm rounded-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value} students
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Render chart based on view mode
  const renderChart = () => {
    if (view === "pie") {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              paddingAngle={5}
              dataKey="value"
              label={({ name, percent }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    if (view === "stats") {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-green-600">
                {stats.totals.present}
              </p>
              <p className="text-sm text-gray-500">Present</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="h-8 w-8 text-red-600" />
              </div>
              <p className="text-3xl font-bold text-red-600">
                {stats.totals.absent}
              </p>
              <p className="text-sm text-gray-500">Absent</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="h-8 w-8 text-yellow-600" />
              </div>
              <p className="text-3xl font-bold text-yellow-600">
                {stats.totals.late}
              </p>
              <p className="text-sm text-gray-500">Late</p>
            </div>
          </div>
        </div>
      );
    }

    // Default bar chart
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={summaryData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: "#e0e0e0" }}
          />
          <YAxis tick={{ fontSize: 12 }} tickLine={{ stroke: "#e0e0e0" }} />
          <Tooltip
            content={<CustomTooltip active={false} payload={[]} label="" />}
          />
          <Legend />
          <Bar
            dataKey="present"
            stackId="a"
            fill="#10B981"
            name="Present"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="absent"
            stackId="a"
            fill="#EF4444"
            name="Absent"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="late"
            stackId="a"
            fill="#F59E0B"
            name="Late"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Attendance Overview</span>
          </CardTitle>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDateRange(date)}</span>
            </div>
            {classId && classId !== "all" && (
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>Class {classId}</span>
              </div>
            )}
            <span className="text-xs bg-gray-100 px-2 py-1 rounded capitalize">
              {view} View
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">{renderChart()}</div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t">
          <div className="text-center md:text-left">
            <p className="text-sm text-gray-500 mb-1">Average Attendance</p>
            <p className="text-2xl font-semibold text-gray-900">
              {stats.averageAttendance}%
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${stats.averageAttendance}%` }}
              />
            </div>
          </div>
          <div className="text-center md:text-left">
            <p className="text-sm text-gray-500 mb-1">Most Absences</p>
            <p className="text-2xl font-semibold text-gray-900">
              {stats.mostAbsencesDay}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              {classId === "all" ? "Across all classes" : `In class ${classId}`}
            </p>
          </div>
          <div className="text-center md:text-left">
            <p className="text-sm text-gray-500 mb-1">Perfect Attendance</p>
            <p className="text-2xl font-semibold text-gray-900">
              {stats.perfectAttendance}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Students with 100% attendance
            </p>
          </div>
        </div>

        {/* Additional insights when viewing all classes */}
        {classId === "all" && (
          <div className="mt-6 pt-6 border-t bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              Class Comparison
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Class 10A:</span>
                <span className="ml-2 text-blue-900 font-medium">
                  {Math.round(
                    (attendanceDataByClass["10A"].reduce(
                      (sum, day) => sum + day.present,
                      0
                    ) /
                      attendanceDataByClass["10A"].reduce(
                        (sum, day) => sum + day.present + day.absent + day.late,
                        0
                      )) *
                      100
                  )}
                  % avg attendance
                </span>
              </div>
              <div>
                <span className="text-blue-700">Class 10B:</span>
                <span className="ml-2 text-blue-900 font-medium">
                  {Math.round(
                    (attendanceDataByClass["10B"].reduce(
                      (sum, day) => sum + day.present,
                      0
                    ) /
                      attendanceDataByClass["10B"].reduce(
                        (sum, day) => sum + day.present + day.absent + day.late,
                        0
                      )) *
                      100
                  )}
                  % avg attendance
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AttendanceSummary;
