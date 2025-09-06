// @ts-nocheck

// ENHANCED: components/analytics/AnalyticsDashboard.jsx
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AcademicPerformance from "./AcademicPerformance";
import AttendanceAnalytics from "./AttendanceAnalytics";
import FinancialMetrics from "./FinancialMetrics";
import ResourceUtilization from "./ResourceUtilization";
import { Calendar, Download, Filter, RotateCcw } from "lucide-react";
import { exportData } from "../../services/dashboardApi";

const AnalyticsDashboard = ({ userRole = "admin" }) => {
  const [timeRange, setTimeRange] = useState("month");
  const [exportFormat, setExportFormat] = useState("pdf");
  const [isExporting, setIsExporting] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [filters, setFilters] = useState({
    department: "all",
    grade: "all",
    subject: "all",
  });
  const [showFilters, setShowFilters] = useState(false);

  const timeRanges = [
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "quarter", label: "This Quarter" },
    { value: "year", label: "This Year" },
    { value: "custom", label: "Custom Range" },
  ];

  const exportFormats = [
    { value: "pdf", label: "PDF Report" },
    { value: "excel", label: "Excel Workbook" },
    { value: "csv", label: "CSV Data" },
    { value: "json", label: "JSON Data" },
  ];

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setLastRefresh(new Date());
      // Trigger refresh of child components
      window.dispatchEvent(new CustomEvent("dashboard-refresh"));
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await exportData("analytics", exportFormat);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleRefresh = () => {
    setLastRefresh(new Date());
    window.dispatchEvent(new CustomEvent("dashboard-refresh"));
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 p-4 bg-white rounded-lg border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Time Range Selector */}
          <div className="flex items-center space-x-2">
            <Calendar className="text-gray-500" size={20} />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="border-gray-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 min-w-[140px]"
            >
              {timeRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          {/* Simple Filters */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {Object.values(filters).some((f) => f !== "all") && (
              <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                Active
              </span>
            )}
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600 flex items-center">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="mr-2 rounded border-gray-300"
              />
              Auto-refresh
            </label>
          </div>

          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Refresh
          </button>

          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
            className="border-gray-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            {exportFormats.map((format) => (
              <option key={format.value} value={format.value}>
                {format.label}
              </option>
            ))}
          </select>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Exporting..." : "Export"}
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Analytics Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Department
                </label>
                <select
                  value={filters.department}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      department: e.target.value,
                    }))
                  }
                  className="w-full border-gray-200 rounded-lg text-sm"
                >
                  <option value="all">All Departments</option>
                  <option value="science">Science</option>
                  <option value="math">Mathematics</option>
                  <option value="english">English</option>
                  <option value="history">History</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Grade Level
                </label>
                <select
                  value={filters.grade}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, grade: e.target.value }))
                  }
                  className="w-full border-gray-200 rounded-lg text-sm"
                >
                  <option value="all">All Grades</option>
                  <option value="9">Grade 9</option>
                  <option value="10">Grade 10</option>
                  <option value="11">Grade 11</option>
                  <option value="12">Grade 12</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Subject
                </label>
                <select
                  value={filters.subject}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, subject: e.target.value }))
                  }
                  className="w-full border-gray-200 rounded-lg text-sm"
                >
                  <option value="all">All Subjects</option>
                  <option value="math">Mathematics</option>
                  <option value="science">Science</option>
                  <option value="english">English</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Academic Performance
              <span className="text-xs text-gray-500">
                Updated: {lastRefresh.toLocaleTimeString()}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AcademicPerformance
              timeRange={timeRange}
              filters={filters}
              key={lastRefresh.getTime()}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <AttendanceAnalytics
              timeRange={timeRange}
              filters={filters}
              key={lastRefresh.getTime()}
            />
          </CardContent>
        </Card>

        {(userRole === "admin" || userRole === "finance") && (
          <Card>
            <CardHeader>
              <CardTitle>Financial Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <FinancialMetrics
                timeRange={timeRange}
                filters={filters}
                key={lastRefresh.getTime()}
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Resource Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <ResourceUtilization
              timeRange={timeRange}
              filters={filters}
              key={lastRefresh.getTime()}
            />
          </CardContent>
        </Card>
      </div>

      {/* Additional Analytics for Admin */}
      {userRole === "admin" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Performance Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Detailed analytics chart for {timeRange}
                </div>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Key Metrics Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      Enrollment Rate
                    </span>
                    <span className="font-semibold">96.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      Teacher Satisfaction
                    </span>
                    <span className="font-semibold">4.2/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">
                      Parent Engagement
                    </span>
                    <span className="font-semibold">78%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
