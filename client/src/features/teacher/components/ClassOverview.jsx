// @ts-nocheck
import React from "react";
import PropTypes from "prop-types";
import { Card, CardContent } from "../../../components/ui/card";
import { Users, UserCheck, UserX, GraduationCap } from "lucide-react";

const colorMap = {
  blue: {
    bg: "bg-blue-100",
    text: "text-blue-600",
  },
  green: {
    bg: "bg-green-100",
    text: "text-green-600",
  },
  red: {
    bg: "bg-red-100",
    text: "text-red-600",
  },
  purple: {
    bg: "bg-purple-100",
    text: "text-purple-600",
  },
};

/**
 * Class overview component showing class statistics
 * @param {object} props - Component properties
 * @param {boolean} [props.loading] - Loading state of the component
 * @param {string} [props.classId] - Selected class identifier
 * @returns {React.ReactElement} ClassOverview component
 */
const ClassOverview = ({ loading = false, classId = "all" }) => {
  // Mock data that varies based on classId
  const getClassStats = (id) => {
    const allClassesStats = {
      all: {
        totalStudents: 150,
        presentToday: 142,
        absentToday: 8,
        averagePerformance: 85,
      },
      "10A": {
        totalStudents: 35,
        presentToday: 32,
        absentToday: 3,
        averagePerformance: 88,
      },
      "10B": {
        totalStudents: 38,
        presentToday: 36,
        absentToday: 2,
        averagePerformance: 82,
      },
      "11A": {
        totalStudents: 40,
        presentToday: 38,
        absentToday: 2,
        averagePerformance: 90,
      },
      "11B": {
        totalStudents: 37,
        presentToday: 36,
        absentToday: 1,
        averagePerformance: 87,
      },
    };

    return allClassesStats[id] || allClassesStats.all;
  };

  const classStats = getClassStats(classId);

  const statCards = [
    {
      title: classId === "all" ? "Total Students" : `Students in ${classId}`,
      value: classStats.totalStudents,
      icon: Users,
      color: "blue",
    },
    {
      title: "Present Today",
      value: classStats.presentToday,
      icon: UserCheck,
      color: "green",
    },
    {
      title: "Absent Today",
      value: classStats.absentToday,
      icon: UserX,
      color: "red",
    },
    {
      title: "Average Performance",
      value: `${classStats.averagePerformance}%`,
      icon: GraduationCap,
      color: "purple",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-gray-100 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Class identifier display */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {classId === "all"
            ? "All Classes Overview"
            : `Class ${classId} Overview`}
        </h2>
        <span className="text-sm text-gray-500">
          {new Date().toLocaleDateString()}
        </span>
      </div>

      {/* Statistics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${colorMap[stat.color].bg}`}>
                  <stat.icon
                    className={`h-6 w-6 ${colorMap[stat.color].text}`}
                  />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold">{stat.value}</h3>
                <p className="text-sm text-gray-500">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

ClassOverview.propTypes = {
  loading: PropTypes.bool,
  classId: PropTypes.string,
};

ClassOverview.defaultProps = {
  loading: false,
  classId: "all",
};

export default ClassOverview;
