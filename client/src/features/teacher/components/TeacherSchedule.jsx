// @ts-nocheck

// src/features/teacher/components/TeacherSchedule.jsx
import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Calendar, Clock, MapPin, Users } from "lucide-react";

const TeacherSchedule = ({ loading = false }) => {
  const schedule = [
    {
      id: 1,
      className: "Mathematics - Class 10A",
      time: "08:00 AM - 09:30 AM",
      room: "Room 101",
      students: 35,
    },
    {
      id: 2,
      className: "Mathematics - Class 9B",
      time: "10:00 AM - 11:30 AM",
      room: "Room 102",
      students: 32,
    },
    {
      id: 3,
      className: "Mathematics - Class 11A",
      time: "01:00 PM - 02:30 PM",
      room: "Room 103",
      students: 30,
    },
    {
      id: 4,
      className: "Mathematics - Class 10B",
      time: "03:00 PM - 04:30 PM",
      room: "Room 101",
      students: 33,
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
          <Calendar className="h-5 w-5" />
          Today's Schedule
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {schedule.map((session) => (
            <div
              key={session.id}
              className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex justify-between items-center">
                <h4 className="font-medium">{session.className}</h4>
                <div className="flex items-center gap-1 text-gray-500">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">{session.students} students</span>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-4 text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{session.time}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{session.room}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TeacherSchedule;
