// @ts-nocheck

// client/src/features/teacher/components/ReportSystem.jsx
import React, { useState } from "react";
import { FileText, Mail, Save, Clock, Printer } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../components/ui/card";

const ReportSystem = () => {
  const [reportType, setReportType] = useState("academic");
  const [timeFrame, setTimeFrame] = useState("term");
  const [selectedClass, setSelectedClass] = useState("all");
  const [customFields, setCustomFields] = useState([]);
  const [reportFormat, setReportFormat] = useState("pdf");

  const reportTemplates = [
    {
      id: "academic",
      name: "Academic Performance",
      description: "Comprehensive grade and performance analysis",
      fields: ["grades", "attendance", "behavior", "comments"],
    },
    {
      id: "attendance",
      name: "Attendance Report",
      description: "Detailed attendance tracking and patterns",
      fields: ["daily_attendance", "late_arrivals", "absences", "trends"],
    },
    {
      id: "behavior",
      name: "Behavioral Report",
      description: "Student conduct and participation analysis",
      fields: ["conduct", "participation", "incidents", "improvements"],
    },
    {
      id: "progress",
      name: "Progress Report",
      description: "Term-wise progress and improvement tracking",
      fields: [
        "academic_progress",
        "skill_development",
        "goals",
        "recommendations",
      ],
    },
  ];

  const availableFields = {
    academic: [
      { id: "grades", label: "Grades" },
      { id: "gpa", label: "GPA" },
      { id: "rank", label: "Class Rank" },
      { id: "subjects", label: "Subject Performance" },
      { id: "assignments", label: "Assignment Completion" },
      { id: "tests", label: "Test Scores" },
      { id: "projects", label: "Project Grades" },
    ],
    attendance: [
      { id: "present", label: "Days Present" },
      { id: "absent", label: "Days Absent" },
      { id: "late", label: "Late Arrivals" },
      { id: "excused", label: "Excused Absences" },
      { id: "unexcused", label: "Unexcused Absences" },
    ],
    // Add more field categories...
  };

  const handleGenerateReport = () => {
    // Report generation logic
  };

  const handleSaveTemplate = () => {
    // Template saving logic
  };

  const handleScheduleReport = () => {
    // Report scheduling logic
  };

  return (
    <div className="space-y-6">
      {/* Report Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {reportTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
          <select
            value={timeFrame}
            onChange={(e) => setTimeFrame(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="term">This Term</option>
            <option value="year">This Year</option>
            <option value="custom">Custom Range</option>
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

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveTemplate}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Save size={16} className="mr-2" />
            Save Template
          </button>
          <button
            onClick={handleGenerateReport}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FileText size={16} className="mr-2" />
            Generate Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Field Selection */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Select Fields to Include
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {availableFields[reportType]?.map((field) => (
                      <label
                        key={field.id}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="checkbox"
                          checked={customFields.includes(field.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCustomFields([...customFields, field.id]);
                            } else {
                              setCustomFields(
                                customFields.filter((f) => f !== field.id)
                              );
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          {field.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Format Options */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Report Format
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {["pdf", "excel", "word", "html"].map((format) => (
                      <button
                        key={format}
                        onClick={() => setReportFormat(format)}
                        className={`p-4 border rounded-lg text-center ${
                          reportFormat === format
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div className="font-medium text-gray-900 uppercase">
                          {format}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Additional Options */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700">
                    Additional Options
                  </h3>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        Include charts and graphs
                      </span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        Add comparison with previous term
                      </span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        Include teacher comments
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <button
                  onClick={() => handleScheduleReport()}
                  className="w-full flex items-center justify-between p-3 text-left border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Schedule Report</span>
                  </div>
                  <span className="text-sm text-gray-500">Weekly</span>
                </button>
                <button className="w-full flex items-center justify-between p-3 text-left border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Email Report</span>
                  </div>
                  <span className="text-sm text-gray-500">To Parents</span>
                </button>
                <button className="w-full flex items-center justify-between p-3 text-left border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <Printer className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">Print Report</span>
                  </div>
                  <span className="text-sm text-gray-500">All Students</span>
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Saved Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportTemplates.map((template) => (
                  <button
                    key={template.id}
                    className="w-full flex items-center justify-between p-3 text-left border rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <h4 className="font-medium">{template.name}</h4>
                      <p className="text-sm text-gray-500">
                        {template.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReportSystem;
