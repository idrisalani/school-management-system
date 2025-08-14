// @ts-nocheck

// client/src/components/analytics/AcademicPerformance.jsx
import React, { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { SlidersHorizontal } from "lucide-react";

// Sample data - would come from API in a real application
const allPerformanceData = {
  monthly: [
    { month: "Jan", grades: 85, completion: 92, participation: 88 },
    { month: "Feb", grades: 82, completion: 88, participation: 85 },
    { month: "Mar", grades: 88, completion: 90, participation: 89 },
    { month: "Apr", grades: 86, completion: 94, participation: 87 },
    { month: "May", grades: 90, completion: 91, participation: 92 },
  ],
  weekly: [
    { month: "Week 1", grades: 87, completion: 94, participation: 90 },
    { month: "Week 2", grades: 85, completion: 89, participation: 88 },
    { month: "Week 3", grades: 91, completion: 93, participation: 92 },
    { month: "Week 4", grades: 88, completion: 91, participation: 89 },
  ],
  yearly: [
    { month: "2022", grades: 84, completion: 87, participation: 86 },
    { month: "2023", grades: 87, completion: 91, participation: 89 },
    { month: "2024", grades: 90, completion: 94, participation: 92 },
  ],
};

/**
 * Academic Performance component showing performance metrics over time
 * @param {object} props - Component props
 * @param {string} props.timeRange - Time range for the data (used for filtering)
 * @returns {React.ReactElement} Academic Performance component
 */
const AcademicPerformance = ({ timeRange = "monthly" }) => {
  const [selectedMetric, setSelectedMetric] = useState("grades");
  const [selectedClass, setSelectedClass] = useState("all");

  // Get performance data based on time range
  const performanceData = useMemo(() => {
    return allPerformanceData[timeRange] || allPerformanceData.monthly;
  }, [timeRange]);

  const metricOptions = [
    { value: "grades", label: "Average Grades" },
    { value: "completion", label: "Assignment Completion" },
    { value: "participation", label: "Class Participation" },
  ];

  const classOptions = [
    { value: "all", label: "All Classes" },
    { value: "10a", label: "Class 10A" },
    { value: "10b", label: "Class 10B" },
    { value: "11a", label: "Class 11A" },
  ];

  /**
   * Custom tooltip component for the chart
   * @param {object} props - Tooltip props from Recharts
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
              {entry.name}: {entry.value}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const currentData = performanceData[performanceData.length - 1];
    const previousData = performanceData[performanceData.length - 2];

    if (!currentData) {
      return { average: 0, improvement: 0, aboveAverage: 0 };
    }

    const currentValue = currentData[selectedMetric] || 0;
    const previousValue = previousData?.[selectedMetric] || currentValue;
    const improvement = currentValue - previousValue;

    // Calculate average across all data points
    const average = Math.round(
      performanceData.reduce(
        (sum, item) => sum + (item[selectedMetric] || 0),
        0
      ) / performanceData.length
    );

    return {
      average,
      improvement: improvement.toFixed(1),
      aboveAverage: Math.round(Math.random() * 30 + 60), // Mock data - would be calculated from actual student data
    };
  }, [performanceData, selectedMetric]);

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center space-x-4">
          <SlidersHorizontal className="text-gray-400" size={20} />
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {metricOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {classOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="text-sm text-gray-500">
          Showing data for: {timeRange}
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: "#e0e0e0" }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              tickLine={{ stroke: "#e0e0e0" }}
            />
            <Tooltip
              content={<CustomTooltip active={false} payload={[]} label="" />}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey={selectedMetric}
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6, stroke: "#3B82F6", strokeWidth: 2 }}
              name={
                metricOptions.find((opt) => opt.value === selectedMetric)
                  ?.label || selectedMetric
              }
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">Average Score</p>
          <p className="text-2xl font-semibold text-gray-900">
            {summaryStats.average}%
          </p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">
            {timeRange === "monthly"
              ? "Monthly"
              : timeRange === "weekly"
                ? "Weekly"
                : "Yearly"}{" "}
            Change
          </p>
          <p
            className={`text-2xl font-semibold ${
              parseFloat(summaryStats.improvement) >= 0
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {parseFloat(summaryStats.improvement) >= 0 ? "+" : ""}
            {summaryStats.improvement}%
          </p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">Students Above Avg</p>
          <p className="text-2xl font-semibold text-gray-900">
            {summaryStats.aboveAverage}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default AcademicPerformance;
