// @ts-nocheck

// src/components/dashboard/DashboardOverview.jsx
import React, { useState, useEffect } from "react";
import { Users, GraduationCap, Clock, CreditCard } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import StatsCard from "../../components/dashboard/StatsCard";
import AttendanceChart from "../../components/dashboard/AttendanceChart";
import RecentActivity from "../../components/dashboard/RecentActivity";
import PerformanceChart from "../../components/dashboard/PerformanceChart";

const DashboardOverview = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        // Replace with your actual API call
        const response = await fetch("/api/dashboard/stats");
        const data = await response.json();
        setDashboardData(data);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = [
    {
      title: "Total Students",
      value: isLoading ? "..." : dashboardData?.studentCount || "2,856",
      change: "+12.5%",
      trend: "up",
      icon: Users,
      color: "blue",
    },
    {
      title: "Total Teachers",
      value: isLoading ? "..." : dashboardData?.teacherCount || "145",
      change: "+4.3%",
      trend: "up",
      icon: GraduationCap,
      color: "green",
    },
    {
      title: "Average Attendance",
      value: isLoading ? "..." : dashboardData?.averageAttendance || "92.8%",
      change: "-2.1%",
      trend: "down",
      icon: Clock,
      color: "orange",
    },
    {
      title: "Revenue",
      value: isLoading ? "..." : dashboardData?.revenue || "$42,850",
      change: "+8.7%",
      trend: "up",
      icon: CreditCard,
      color: "purple",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatsCard key={stat.title} {...stat} loading={isLoading} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <AttendanceChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Academic Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <PerformanceChart />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentActivity />
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardOverview;
