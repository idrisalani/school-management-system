// @ts-nocheck

// src/features/teacher/components/UpcomingAssessments.jsx
import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Calendar, Clock, FileText, Edit2 } from "lucide-react";

const UpcomingAssessments = ({ loading = false }) => {
  const assessments = [
    {
      id: 1,
      title: "Mid-Term Test",
      subject: "Mathematics",
      date: "2024-03-20",
      duration: "90 mins",
      type: "Test",
    },
    {
      id: 2,
      title: "Science Project Presentation",
      subject: "Science",
      date: "2024-03-22",
      duration: "120 mins",
      type: "Presentation",
    },
    {
      id: 3,
      title: "Essay Submission",
      subject: "English",
      date: "2024-03-25",
      duration: "60 mins",
      type: "Assignment",
    },
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Assessments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 bg-gray-100 animate-pulse rounded-lg"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Upcoming Assessments
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {assessments.map((assessment) => (
            <div
              key={assessment.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="space-y-1">
                <h4 className="font-medium">{assessment.title}</h4>
                <p className="text-sm text-gray-500">{assessment.subject}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">
                    {new Date(assessment.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{assessment.duration}</span>
                </div>
                <button className="p-1 hover:bg-gray-200 rounded-full">
                  <Edit2 className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingAssessments;
