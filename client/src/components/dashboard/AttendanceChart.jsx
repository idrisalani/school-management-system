// src/components/dashboard/AttendanceChart.jsx
import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const AttendanceChart = ({ data = [], loading = false }) => {
  const attendanceData = [
    { month: 'Jan', attendance: 95 },
    { month: 'Feb', attendance: 92 },
    { month: 'Mar', attendance: 88 },
    { month: 'Apr', attendance: 90 },
    { month: 'May', attendance: 94 }
  ];

  if (loading) {
    return <div className="h-64 w-full animate-pulse bg-gray-100 rounded-lg" />;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={data.length ? data : attendanceData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="attendance" fill="#4F46E5" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AttendanceChart;