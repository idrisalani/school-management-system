// @ts-nocheck

// client/src/components/analytics/AnalyticsDashboard.jsx
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AcademicPerformance from "./AcademicPerformance";
import AttendanceAnalytics from "./AttendanceAnalytics";
import FinancialMetrics from "./FinancialMetrics";
import ResourceUtilization from "./ResourceUtilization";
import { Calendar, Download } from "lucide-react";

const AnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState("month");
  const [exportFormat, setExportFormat] = useState("pdf");

  const timeRanges = [
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "quarter", label: "This Quarter" },
    { value: "year", label: "This Year" },
  ];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Time Range Selector */}
        <div className="flex items-center space-x-2">
          <Calendar className="text-gray-500" size={20} />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border-gray-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            {timeRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>

        {/* Export Controls */}
        <div className="flex items-center space-x-2">
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
            className="border-gray-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="pdf">PDF Report</option>
            <option value="excel">Excel</option>
            <option value="csv">CSV</option>
          </select>
          <button className="inline-flex items-center px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Academic Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <AcademicPerformance timeRange={timeRange} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <AttendanceAnalytics timeRange={timeRange} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <FinancialMetrics timeRange={timeRange} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resource Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <ResourceUtilization timeRange={timeRange} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
