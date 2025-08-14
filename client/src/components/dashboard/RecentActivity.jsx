// @ts-nocheck

// src/components/dashboard/RecentActivity.jsx
import React from "react";
import { Clock, User } from "lucide-react";

const RecentActivity = ({ activities = [], loading = false }) => {
  const defaultActivities = [
    {
      id: 1,
      action: "Marked attendance",
      user: "John Doe",
      time: "2 hours ago",
    },
    {
      id: 2,
      action: "Updated grades",
      user: "Jane Smith",
      time: "3 hours ago",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse bg-gray-100 rounded-lg" />
        ))}
      </div>
    );
  }

  const displayActivities = activities.length ? activities : defaultActivities;

  return (
    <div className="space-y-4">
      {displayActivities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center space-x-3">
            <User className="h-5 w-5 text-gray-500" />
            <div>
              <p className="font-medium">{activity.action}</p>
              <p className="text-sm text-gray-500">{activity.user}</p>
            </div>
          </div>
          <div className="flex items-center text-gray-500">
            <Clock className="h-4 w-4 mr-1" />
            <span className="text-sm">{activity.time}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentActivity;
