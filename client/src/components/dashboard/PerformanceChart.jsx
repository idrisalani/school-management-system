// src/components/dashboard/PerformanceChart.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PerformanceChart = ({ loading, error }) => {
  const data = [
    { subject: 'Math', average: 82 },
    { subject: 'Science', average: 78 },
    { subject: 'English', average: 85 },
    { subject: 'History', average: 76 },
    { subject: 'Art', average: 90 }
  ];

  if (loading) {
    return (
      <div className="h-64 w-full animate-pulse bg-gray-100 rounded-lg" />
    );
  }

  if (error) {
    return (
      <div className="h-64 w-full flex items-center justify-center">
        <p className="text-red-500">Failed to load performance data</p>
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="subject" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Bar dataKey="average" fill="#8b5cf6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

PerformanceChart.propTypes = {
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.bool])
};

export default PerformanceChart ;