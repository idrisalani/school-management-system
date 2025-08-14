// src/features/student/components/GradesChart.jsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

const GradesChart = ({ loading = false }) => {
  const gradesData = [
    { subject: 'Math', grade: 85, average: 78 },
    { subject: 'Science', grade: 92, average: 80 },
    { subject: 'English', grade: 88, average: 82 },
    { subject: 'History', grade: 90, average: 79 },
    { subject: 'Art', grade: 95, average: 85 }
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Grades Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-gray-100 animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Grades Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={gradesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="subject" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="grade" 
                stroke="#4F46E5" 
                strokeWidth={2} 
                dot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="average" 
                stroke="#94A3B8" 
                strokeWidth={2} 
                strokeDasharray="5 5"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default GradesChart;
