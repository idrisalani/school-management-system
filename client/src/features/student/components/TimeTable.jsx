// @ts-nocheck

// src/features/student/components/TimeTable.jsx
import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Calendar, Clock } from "lucide-react";

const TimeTable = ({ loading = false }) => {
  const schedule = [
    {
      id: 1,
      subject: "Mathematics",
      time: "08:00 AM",
      room: "Room 101",
      teacher: "Mr. Smith",
    },
    {
      id: 2,
      subject: "Science",
      time: "09:30 AM",
      room: "Lab 201",
      teacher: "Mrs. Johnson",
    },
    {
      id: 3,
      subject: "English",
      time: "11:00 AM",
      room: "Room 103",
      teacher: "Ms. Davis",
    },
    {
      id: 4,
      subject: "History",
      time: "01:00 PM",
      room: "Room 104",
      teacher: "Mr. Wilson",
    },
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Today's Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Today's Schedule
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {schedule.map((class_) => (
            <div
              key={class_.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="space-y-1">
                <h4 className="font-medium">{class_.subject}</h4>
                <p className="text-sm text-gray-500">{class_.teacher}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{class_.time}</span>
                </div>
                <div className="text-sm text-gray-500">{class_.room}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TimeTable;
