// @ts-nocheck

// client/src/features/teacher/components/AssignmentManagement.jsx
import React, { useState } from "react";
import {
  FileText,
  Calendar,
  Clock,
  Download,
  Search,
  CheckCircle,
  Eye,
  BarChart2,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../components/ui/card";

const AssignmentManagement = () => {
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const assignments = [
    {
      id: 1,
      title: "Chapter 5 Practice Problems",
      subject: "Mathematics",
      class: "10A",
      dueDate: "2024-04-10",
      totalStudents: 30,
      submitted: 25,
      graded: 20,
      averageScore: 85,
      status: "active",
    },
    {
      id: 2,
      title: "Lab Report - Newton's Laws",
      subject: "Physics",
      class: "11B",
      dueDate: "2024-04-12",
      totalStudents: 28,
      submitted: 15,
      graded: 10,
      averageScore: 78,
      status: "active",
    },
  ];

  const handleCreateAssignment = () => {
    // Handle assignment creation
  };

  const handleGradeAssignment = (assignmentId) => {
    // Handle grading
    console.log("Grading assignment:", assignmentId);
  };

  const handleDownloadSubmissions = (assignmentId) => {
    // Handle download
    console.log("Downloading submissions for assignment:", assignmentId);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search assignments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-full sm:w-64"
            />
          </div>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">All Classes</option>
            <option value="10A">Class 10A</option>
            <option value="10B">Class 10B</option>
          </select>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">All Subjects</option>
            <option value="math">Mathematics</option>
            <option value="physics">Physics</option>
          </select>
        </div>

        <button
          onClick={handleCreateAssignment}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <FileText size={16} className="mr-2" />
          Create Assignment
        </button>
      </div>

      {/* Assignment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <FileText size={20} />
              </div>
              <span className="text-sm text-blue-600">Total</span>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-semibold">24</h3>
              <p className="text-sm text-gray-500">Active Assignments</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-green-100 text-green-600">
                <CheckCircle size={20} />
              </div>
              <span className="text-sm text-green-600">Submissions</span>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-semibold">85%</h3>
              <p className="text-sm text-gray-500">Average Submission Rate</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-yellow-100 text-yellow-600">
                <Clock size={20} />
              </div>
              <span className="text-sm text-yellow-600">Pending</span>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-semibold">8</h3>
              <p className="text-sm text-gray-500">Need Grading</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                <BarChart2 size={20} />
              </div>
              <span className="text-sm text-purple-600">Average</span>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-semibold">82%</h3>
              <p className="text-sm text-gray-500">Average Score</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignment List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Assignment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Submissions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Average Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {assignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {assignment.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {assignment.subject} - {assignment.class}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar size={16} className="text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {new Date(assignment.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${(assignment.submitted / assignment.totalStudents) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="ml-2 text-sm text-gray-600">
                            {assignment.submitted}/{assignment.totalStudents}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {assignment.graded} graded
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          assignment.averageScore >= 85
                            ? "bg-green-100 text-green-800"
                            : assignment.averageScore >= 70
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {assignment.averageScore}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {assignment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleGradeAssignment(assignment.id)}
                          className="p-1 hover:bg-gray-100 rounded-lg"
                          title="Grade Submissions"
                        >
                          <CheckCircle size={16} className="text-green-600" />
                        </button>
                        <button
                          onClick={() =>
                            handleDownloadSubmissions(assignment.id)
                          }
                          className="p-1 hover:bg-gray-100 rounded-lg"
                          title="Download Submissions"
                        >
                          <Download size={16} className="text-gray-600" />
                        </button>
                        <button
                          className="p-1 hover:bg-gray-100 rounded-lg"
                          title="View Details"
                        >
                          <Eye size={16} className="text-blue-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Assignment Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Submission Trends</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Add a line chart for submission trends */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Add a bar chart for grade distribution */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AssignmentManagement;
