// @ts-nocheck
// client/src/components/analytics/FinancialMetrics.jsx
/// <reference types="react" />
import React, { useState } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";

/**
 * @typedef {object} FinancialDataPoint
 * @property {string} month - Month name (e.g., "Jan", "Feb")
 * @property {number} revenue - Monthly revenue amount in dollars
 * @property {number} expenses - Monthly expenses amount in dollars
 * @property {number} fees - Monthly fees collected in dollars
 */

/**
 * @typedef {object} FinancialMetricsProps
 * @property {string} [timeRange] - Time range for the metrics display
 */

/**
 * @typedef {object} MetricOption
 * @property {string} value - Metric key name
 * @property {string} label - Display label for the metric
 * @property {string} color - Chart color for the metric
 * @property {React.ComponentType} icon - Icon component for the metric
 */

/**
 * Financial Metrics Dashboard Component
 * Displays revenue, expenses, and fees data with interactive charts
 * @param {FinancialMetricsProps} props - Component properties
 * @returns {React.ReactElement} Financial metrics dashboard
 */
const FinancialMetrics = ({ timeRange = "Last 5 months" }) => {
  const [selectedMetric, setSelectedMetric] = useState("revenue");

  // Sample financial data - replace with actual API call
  /** @type {FinancialDataPoint[]} */
  const financialData = [
    { month: "Jan", revenue: 45000, expenses: 32000, fees: 42000 },
    { month: "Feb", revenue: 48000, expenses: 34000, fees: 44000 },
    { month: "Mar", revenue: 52000, expenses: 35000, fees: 48000 },
    { month: "Apr", revenue: 49000, expenses: 33000, fees: 45000 },
    { month: "May", revenue: 53000, expenses: 36000, fees: 49000 },
  ];

  /** @type {MetricOption[]} */
  const metrics = [
    { value: "revenue", label: "Revenue", color: "#8884d8", icon: DollarSign },
    {
      value: "expenses",
      label: "Expenses",
      color: "#82ca9d",
      icon: TrendingDown,
    },
    {
      value: "fees",
      label: "Fees Collected",
      color: "#ffc658",
      icon: TrendingUp,
    },
  ];

  /**
   * Calculate total for selected metric
   * @param {string} metric - Metric name (revenue, expenses, fees)
   * @returns {number} Total value for the metric
   */
  const calculateTotal = (metric) => {
    if (!Array.isArray(financialData)) return 0;

    return financialData.reduce((sum, item) => {
      const value = item?.[metric];
      return sum + (typeof value === "number" ? value : 0);
    }, 0);
  };

  /**
   * Calculate percentage change from previous period
   * @param {string} metric - Metric name (revenue, expenses, fees)
   * @returns {number} Percentage change from previous period
   */
  const calculateChange = (metric) => {
    if (!Array.isArray(financialData) || financialData.length < 2) return 0;

    const current = financialData[financialData.length - 1]?.[metric];
    const previous = financialData[financialData.length - 2]?.[metric];

    if (
      typeof current !== "number" ||
      typeof previous !== "number" ||
      previous === 0
    ) {
      return 0;
    }

    return ((current - previous) / previous) * 100;
  };

  /**
   * Handle metric selection change
   * @param {string} metric - Selected metric name
   * @returns {void}
   */
  const handleMetricChange = (metric) => {
    if (typeof metric === "string" && metrics.some((m) => m.value === metric)) {
      setSelectedMetric(metric);
    }
  };

  /**
   * Format currency value - handles both string and number types for Recharts compatibility
   * @param {string|number} value - Numeric value to format
   * @returns {string} Formatted currency string
   */
  const formatCurrency = (value) => {
    // Handle different input types (Recharts can pass strings or numbers)
    let numericValue;

    if (typeof value === "string") {
      numericValue = parseFloat(value);
    } else if (typeof value === "number") {
      numericValue = value;
    } else {
      return "$0";
    }

    // Handle invalid/NaN values
    if (isNaN(numericValue) || !isFinite(numericValue)) {
      return "$0";
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numericValue);
  };

  /**
   * Format percentage change with sign
   * @param {number} change - Percentage change value
   * @returns {string} Formatted percentage with + or - sign
   */
  const formatPercentage = (change) => {
    if (typeof change !== "number" || isNaN(change)) return "0.0%";

    const sign = change >= 0 ? "+" : "";
    return `${sign}${change.toFixed(1)}%`;
  };

  /**
   * Safe formatter for Recharts Tooltip - handles ValueType properly
   * @param {string|number} value - Value from chart (can be string or number)
   * @param {string} name - Data key name
   * @returns {[string, string]} Tuple of formatted value and name
   */
  const safeTooltipFormatter = (value, name) => {
    return [formatCurrency(value), name || "Value"];
  };

  /**
   * Safe formatter for Recharts Y-axis ticks - handles ValueType properly
   * @param {string|number} value - Tick value (can be string or number)
   * @returns {string} Formatted tick label
   */
  const safeTickFormatter = (value) => {
    return formatCurrency(value);
  };

  // Get data for currently selected metric
  const selectedMetricData = metrics.find((m) => m.value === selectedMetric);
  const total = calculateTotal(selectedMetric);
  const change = calculateChange(selectedMetric);
  const ChangeIcon = change >= 0 ? TrendingUp : TrendingDown;

  // Calculate average
  const average = financialData.length > 0 ? total / financialData.length : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Financial Metrics
        </h3>

        {/* Metric Selection Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {metrics.map((metric) => {
            const IconComponent = metric.icon;
            return (
              <button
                key={metric.value}
                onClick={() => handleMetricChange(metric.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                  selectedMetric === metric.value
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                aria-pressed={selectedMetric === metric.value}
              >
                <IconComponent size={16} className="mr-2" />
                {metric.label}
              </button>
            );
          })}
        </div>

        {/* Summary Statistics Cards */}
        {selectedMetricData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Total Card */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    Total {selectedMetricData.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-800">
                    {formatCurrency(total)}
                  </p>
                </div>
                <selectedMetricData.icon size={32} className="text-blue-500" />
              </div>
            </div>

            {/* Monthly Change Card */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Monthly Change</p>
                  <div className="flex items-center">
                    <p
                      className={`text-2xl font-bold ${
                        change >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {formatPercentage(change)}
                    </p>
                    <ChangeIcon
                      size={20}
                      className={`ml-1 ${
                        change >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Average Card */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Average Monthly</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {formatCurrency(average)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Chart */}
      <div
        className="h-80"
        role="img"
        aria-label={`${selectedMetricData?.label || "Financial"} chart over time`}
      >
        <ResponsiveContainer width="100%" height="100%">
          {selectedMetric === "revenue" ? (
            <AreaChart
              data={financialData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#666" }}
              />
              <YAxis
                tickFormatter={safeTickFormatter}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#666" }}
              />
              <Tooltip
                formatter={safeTooltipFormatter}
                labelStyle={{ color: "#374151" }}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey={selectedMetric}
                stroke="#8884d8"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
                name={selectedMetricData?.label}
              />
            </AreaChart>
          ) : (
            <LineChart
              data={financialData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#666" }}
              />
              <YAxis
                tickFormatter={safeTickFormatter}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#666" }}
              />
              <Tooltip
                formatter={safeTooltipFormatter}
                labelStyle={{ color: "#374151" }}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey={selectedMetric}
                stroke={selectedMetricData?.color || "#8884d8"}
                strokeWidth={2}
                dot={{
                  fill: selectedMetricData?.color || "#8884d8",
                  strokeWidth: 2,
                  r: 4,
                }}
                activeDot={{
                  r: 6,
                  fill: selectedMetricData?.color || "#8884d8",
                }}
                name={selectedMetricData?.label}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Footer Information */}
      <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
        <span>Showing data for: {timeRange}</span>
        <span>Last updated: {new Date().toLocaleDateString()}</span>
      </div>
    </div>
  );
};

export default FinancialMetrics;
