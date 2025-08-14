// @ts-nocheck

// client/src/components/analytics/AttendanceAnalytics.jsx
import React, { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Calendar, ArrowDown, ArrowUp } from "lucide-react";

// Sample data for different time ranges - would come from API in a real application
const allAttendanceData = {
  daily: [
    { day: "Mon", present: 92, absent: 8, late: 4 },
    { day: "Tue", present: 88, absent: 12, late: 6 },
    { day: "Wed", present: 95, absent: 5, late: 3 },
    { day: "Thu", present: 90, absent: 10, late: 5 },
    { day: "Fri", present: 93, absent: 7, late: 4 },
  ],
  weekly: [
    { day: "Week 1", present: 91, absent: 9, late: 5 },
    { day: "Week 2", present: 89, absent: 11, late: 7 },
    { day: "Week 3", present: 94, absent: 6, late: 4 },
    { day: "Week 4", present: 92, absent: 8, late: 3 },
  ],
  monthly: [
    { day: "Jan", present: 88, absent: 12, late: 6 },
    { day: "Feb", present: 91, absent: 9, late: 5 },
    { day: "Mar", present: 93, absent: 7, late: 4 },
    { day: "Apr", present: 95, absent: 5, late: 3 },
    { day: "May", present: 92, absent: 8, late: 4 },
  ],
};

const trendsByTimeRange = {
  daily: [
    { label: "Overall Attendance", value: "92%", change: "+2.5%", trend: "up" },
    { label: "Late Arrivals", value: "4.5%", change: "-1.2%", trend: "down" },
    { label: "Absence Rate", value: "3.5%", change: "-0.8%", trend: "down" },
  ],
  weekly: [
    {
      label: "Overall Attendance",
      value: "91.5%",
      change: "+1.8%",
      trend: "up",
    },
    { label: "Late Arrivals", value: "4.8%", change: "-0.9%", trend: "down" },
    { label: "Absence Rate", value: "8.5%", change: "-1.1%", trend: "down" },
  ],
  monthly: [
    {
      label: "Overall Attendance",
      value: "91.8%",
      change: "+3.2%",
      trend: "up",
    },
    { label: "Late Arrivals", value: "4.4%", change: "-1.5%", trend: "down" },
    { label: "Absence Rate", value: "8.2%", change: "-2.1%", trend: "down" },
  ],
};

/**
 * Attendance Analytics component showing attendance metrics over time
 * @param {object} props - Component props
 * @param {string} props.timeRange - Time range for the data (daily, weekly, monthly)
 * @returns {React.ReactElement} Attendance Analytics component
 */
const AttendanceAnalytics = ({ timeRange = "daily" }) => {
  const [selectedView, setSelectedView] = useState(timeRange);

  // Get attendance data based on time range
  const attendanceData = useMemo(() => {
    return allAttendanceData[timeRange] || allAttendanceData.daily;
  }, [timeRange]);

  // Get trends based on time range
  const trends = useMemo(() => {
    return trendsByTimeRange[timeRange] || trendsByTimeRange.daily;
  }, [timeRange]);

  // Update selectedView when timeRange prop changes
  React.useEffect(() => {
    setSelectedView(timeRange);
  }, [timeRange]);

  const viewOptions = [
    { value: "daily", label: "Daily View" },
    { value: "weekly", label: "Weekly View" },
    { value: "monthly", label: "Monthly View" },
  ];

  /**
   * Trend indicator component
   * @param {object} props - Component props
   * @param {string} props.trend - Trend direction ('up' or 'down')
   * @param {string} props.change - Change percentage
   * @returns {React.ReactElement} Trend indicator component
   */
  const TrendIndicator = ({ trend, change }) => (
    <div
      className={`flex items-center ${
        trend === "up" ? "text-green-600" : "text-red-600"
      }`}
    >
      {trend === "up" ? (
        <ArrowUp size={16} className="mr-1" />
      ) : (
        <ArrowDown size={16} className="mr-1" />
      )}
      <span className="text-sm font-medium">{change}</span>
    </div>
  );

  // Generate insights based on current data
  const insights = useMemo(() => {
    const maxAttendanceDay = attendanceData.reduce((prev, current) =>
      prev.present > current.present ? prev : current
    );

    const avgAttendance = Math.round(
      attendanceData.reduce((sum, day) => sum + day.present, 0) /
        attendanceData.length
    );

    const totalLate = attendanceData.reduce((sum, day) => sum + day.late, 0);
    const avgLate = Math.round(totalLate / attendanceData.length);

    const timeLabel =
      timeRange === "daily"
        ? "this week"
        : timeRange === "weekly"
          ? "this month"
          : "this year";

    return [
      `Highest attendance on ${maxAttendanceDay.day} (${maxAttendanceDay.present}%)`,
      `Average attendance rate: ${avgAttendance}% for ${timeLabel}`,
      `Average late arrivals: ${avgLate}% per ${timeRange.slice(0, -2)}`,
    ];
  }, [attendanceData, timeRange]);

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Calendar className="text-gray-400" size={20} />
          <select
            value={selectedView}
            onChange={(e) => setSelectedView(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {viewOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="text-sm text-gray-500">Showing {timeRange} data</div>
      </div>

      {/* Trends */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {trends.map((trend) => (
          <div
            key={trend.label}
            className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
          >
            <p className="text-sm text-gray-500 mb-2">{trend.label}</p>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-semibold text-gray-900">
                {trend.value}
              </p>
              <TrendIndicator trend={trend.trend} change={trend.change} />
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="h-80 bg-white p-4 rounded-lg border border-gray-200">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={attendanceData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: "#e0e0e0" }}
            />
            <YAxis tick={{ fontSize: 12 }} tickLine={{ stroke: "#e0e0e0" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
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
      </div>

      {/* Summary */}
      <div className="mt-6 bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Key Insights ({timeRange.charAt(0).toUpperCase() + timeRange.slice(1)}{" "}
          View)
        </h4>
        <ul className="space-y-2 text-sm text-gray-600">
          {insights.map((insight, index) => (
            <li key={index} className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              {insight}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AttendanceAnalytics;
