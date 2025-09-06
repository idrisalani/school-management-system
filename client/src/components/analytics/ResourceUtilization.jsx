// client/src/components/analytics/ResourceUtilization.jsx
import React from "react";

const ResourceUtilization = ({ data = [] }) => {
  // Mock data if none provided
  const mockData = [
    { resource: "Classrooms", used: 85, total: 100, percentage: 85 },
    { resource: "Teachers", used: 42, total: 45, percentage: 93 },
    { resource: "Equipment", used: 68, total: 80, percentage: 85 },
    { resource: "Library", used: 156, total: 200, percentage: 78 },
  ];

  const utilizationData = data.length > 0 ? data : mockData;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Resource Utilization
      </h3>

      <div className="space-y-4">
        {utilizationData.map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                {item.resource}
              </span>
              <span className="text-sm text-gray-500">
                {item.used}/{item.total} ({item.percentage}%)
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  item.percentage >= 90
                    ? "bg-red-500"
                    : item.percentage >= 75
                      ? "bg-yellow-500"
                      : "bg-green-500"
                }`}
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-xs text-gray-500">
        Last updated: {new Date().toLocaleString()}
      </div>
    </div>
  );
};

export default ResourceUtilization;
