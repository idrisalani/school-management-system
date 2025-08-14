// @ts-nocheck

// client/src/features/admin/components/SystemHealth.jsx
import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import { AlertCircle, CheckCircle, Server, RefreshCw } from "lucide-react";
import "react-circular-progressbar/dist/styles.css";

const SystemHealth = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Sample system health data
  const healthData = {
    cpu: {
      usage: 45,
      temperature: 65,
      cores: 8,
    },
    memory: {
      usage: 68,
      total: "16GB",
      available: "5.12GB",
    },
    disk: {
      usage: 72,
      total: "512GB",
      available: "143.36GB",
    },
    services: [
      { name: "Web Server", status: "running", uptime: "15d 23h" },
      { name: "Database", status: "running", uptime: "15d 23h" },
      { name: "Cache Server", status: "running", uptime: "7d 12h" },
      { name: "Task Queue", status: "warning", uptime: "2d 4h" },
    ],
  };

  const performanceData = [
    { time: "00:00", cpu: 42, memory: 65, network: 30 },
    { time: "04:00", cpu: 38, memory: 62, network: 25 },
    { time: "08:00", cpu: 45, memory: 68, network: 35 },
    { time: "12:00", cpu: 52, memory: 72, network: 40 },
    { time: "16:00", cpu: 48, memory: 70, network: 38 },
    { time: "20:00", cpu: 44, memory: 66, network: 32 },
  ];

  const getStatusColor = (value) => {
    if (value < 60) return "#10B981"; // Green
    if (value < 80) return "#F59E0B"; // Yellow
    return "#EF4444"; // Red
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate data refresh
    setTimeout(() => {
      setIsRefreshing(false);
      setLastUpdated(new Date());
    }, 1000);
  };

  // Custom tooltip for the performance graph
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

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Server className="h-5 w-5 text-gray-500" />
          <span className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Resource Usage */}
      <div className="grid grid-cols-3 gap-6">
        {["cpu", "memory", "disk"].map((resource) => (
          <div key={resource} className="text-center">
            <div className="w-24 h-24 mx-auto">
              <CircularProgressbar
                value={healthData[resource].usage}
                text={`${healthData[resource].usage}%`}
                styles={buildStyles({
                  pathColor: getStatusColor(healthData[resource].usage),
                  textColor: getStatusColor(healthData[resource].usage),
                  trailColor: "#E5E7EB",
                })}
              />
            </div>
            <div className="mt-3">
              <p className="text-sm font-medium text-gray-900 capitalize">
                {resource}
              </p>
              <p className="text-xs text-gray-500">
                {healthData[resource].available} available of{" "}
                {healthData[resource].total}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Graph */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">
          Performance History
        </h3>
        <div className="h-64 bg-white p-4 rounded-lg border border-gray-200">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="time" stroke="#6B7280" fontSize={12} />
              <YAxis
                stroke="#6B7280"
                fontSize={12}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="cpu"
                name="CPU"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="memory"
                name="Memory"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="network"
                name="Network"
                stroke="#6366F1"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Services Status */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">
          Services Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {healthData.services.map((service) => (
            <div
              key={service.name}
              className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
            >
              <div className="flex items-center space-x-3">
                {service.status === "running" ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {service.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Uptime: {service.uptime}
                  </p>
                </div>
              </div>
              <span
                className={`
                px-2.5 py-0.5 rounded-full text-xs font-medium
                ${
                  service.status === "running"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }
              `}
              >
                {service.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* System Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="font-medium text-gray-600">System Uptime</p>
          <p className="mt-1 text-lg font-semibold">15 days 23 hours</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="font-medium text-gray-600">Active Users</p>
          <p className="mt-1 text-lg font-semibold">247</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="font-medium text-gray-600">Server Location</p>
          <p className="mt-1 text-lg font-semibold">US-West</p>
        </div>
      </div>
    </div>
  );
};

export default SystemHealth;
