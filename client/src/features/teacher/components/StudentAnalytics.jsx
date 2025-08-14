// @ts-nocheck

// client/src/features/teacher/components/StudentAnalytics.jsx
import React, { useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { TrendingUp, Award, Clock, Download, Book } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../components/ui/card";

const StudentAnalytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("term");
  const [selectedClass, setSelectedClass] = useState("all");

  const performanceData = [
    { month: "Jan", attendance: 95, grades: 88, participation: 90 },
    { month: "Feb", attendance: 92, grades: 85, participation: 88 },
    { month: "Mar", attendance: 96, grades: 90, participation: 92 },
    { month: "Apr", attendance: 94, grades: 87, participation: 89 },
  ];

  const gradeDistribution = [
    { grade: "A", students: 25, color: "#10B981" },
    { grade: "B", students: 35, color: "#3B82F6" },
    { grade: "C", students: 20, color: "#F59E0B" },
    { grade: "D", students: 15, color: "#EF4444" },
    { grade: "F", students: 5, color: "#6B7280" },
  ];

  const subjectPerformance = [
    { subject: "Math", average: 85, highest: 98, lowest: 65 },
    { subject: "Science", average: 82, highest: 95, lowest: 62 },
    { subject: "English", average: 88, highest: 96, lowest: 70 },
    { subject: "History", average: 84, highest: 94, lowest: 68 },
  ];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="term">This Term</option>
            <option value="year">This Year</option>
          </select>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">All Classes</option>
            <option value="10A">Class 10A</option>
            <option value="10B">Class 10B</option>
          </select>
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <Download size={16} className="mr-2" />
          Export Report
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <TrendingUp size={20} />
              </div>
              <span className="text-sm font-medium text-blue-600">+5.2%</span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-semibold">86%</p>
              <p className="text-sm text-gray-500">Average Performance</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-green-100 text-green-600">
                <Clock size={20} />
              </div>
              <span className="text-sm font-medium text-green-600">+2.1%</span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-semibold">94%</p>
              <p className="text-sm text-gray-500">Attendance Rate</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                <Award size={20} />
              </div>
              <span className="text-sm font-medium text-purple-600">+3.8%</span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-semibold">38</p>
              <p className="text-sm text-gray-500">High Performers</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                <Book size={20} />
              </div>
              <span className="text-sm font-medium text-orange-600">+1.4%</span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-semibold">92%</p>
              <p className="text-sm text-gray-500">Assignment Completion</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="grades"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    name="Grades"
                  />
                  <Line
                    type="monotone"
                    dataKey="attendance"
                    stroke="#10B981"
                    strokeWidth={2}
                    name="Attendance"
                  />
                  <Line
                    type="monotone"
                    dataKey="participation"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    name="Participation"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gradeDistribution}
                    dataKey="students"
                    nameKey="grade"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {gradeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Subject Performance Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="average" fill="#3B82F6" name="Average Score" />
                <Bar dataKey="highest" fill="#10B981" name="Highest Score" />
                <Bar dataKey="lowest" fill="#EF4444" name="Lowest Score" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Present</span>
                <span className="text-sm text-gray-500">92%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: "92%" }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Late</span>
                <span className="text-sm text-gray-500">5%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{ width: "5%" }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Absent</span>
                <span className="text-sm text-gray-500">3%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: "3%" }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assignment Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { subject: "Mathematics", completed: 95 },
                { subject: "Science", completed: 88 },
                { subject: "English", completed: 92 },
                { subject: "History", completed: 85 },
              ].map((subject) => (
                <div key={subject.subject} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {subject.subject}
                    </span>
                    <span className="text-sm text-gray-500">
                      {subject.completed}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${subject.completed}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Indicators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: "Class Participation", value: 88, color: "blue" },
                { label: "Homework Quality", value: 92, color: "green" },
                { label: "Test Scores", value: 85, color: "purple" },
                { label: "Project Work", value: 90, color: "orange" },
              ].map((indicator) => (
                <div key={indicator.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {indicator.label}
                    </span>
                    <span className={`text-sm text-${indicator.color}-600`}>
                      {indicator.value}/100
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`bg-${indicator.color}-500 h-2 rounded-full`}
                      style={{ width: `${indicator.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentAnalytics;
