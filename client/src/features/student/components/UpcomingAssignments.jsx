// @ts-nocheck

// src/features/student/components/UpcomingAssignments.jsx
import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Calendar, FileText, AlertCircle } from "lucide-react";

const UpcomingAssignments = ({ loading = false }) => {
  const assignments = [
    {
      id: 1,
      title: "Mathematics Homework",
      subject: "Mathematics",
      dueDate: "2024-03-20",
      priority: "high",
      status: "pending",
    },
    {
      id: 2,
      title: "Science Project",
      subject: "Science",
      dueDate: "2024-03-22",
      priority: "medium",
      status: "pending",
    },
    {
      id: 3,
      title: "History Essay",
      subject: "History",
      dueDate: "2024-03-25",
      priority: "low",
      status: "pending",
    },
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 bg-gray-100 animate-pulse rounded-lg"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPriorityColor = (priority) => {
    const colors = {
      high: "text-red-500",
      medium: "text-yellow-500",
      low: "text-green-500",
    };
    return colors[priority] || "text-gray-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Upcoming Assignments
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="space-y-1">
                <h4 className="font-medium">{assignment.title}</h4>
                <p className="text-sm text-gray-500">{assignment.subject}</p>
              </div>
              <div className="flex items-center gap-4">
                <div
                  className={`flex items-center gap-1 ${getPriorityColor(assignment.priority)}`}
                >
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm capitalize">
                    {assignment.priority}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">
                    {new Date(assignment.dueDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingAssignments;
