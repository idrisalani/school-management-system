// @ts-nocheck

// src/components/dashboard/DashboardOverview.jsx
import { useState, useEffect } from "react";
import { Users, GraduationCap, Clock, CreditCard } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import StatsCard from "./StatsCard";
import AttendanceChart from "./AttendanceChart";
import RecentActivity from "./RecentActivity";
import PerformanceChart from "./PerformanceChart";

const DashboardOverview = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch("/api/dashboard/stats");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setDashboardData(data);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = [
    {
      title: "Total Students",
      value: dashboardData?.studentCount || "2,856",
      change: "+12.5%",
      trend: "up",
      icon: Users,
      color: "blue",
    },
    {
      title: "Total Teachers",
      value: dashboardData?.teacherCount || "145",
      change: "+4.3%",
      trend: "up",
      icon: GraduationCap,
      color: "green",
    },
    {
      title: "Average Attendance",
      value: dashboardData?.averageAttendance || "92.8%",
      change: "-2.1%",
      trend: "down",
      icon: Clock,
      color: "orange",
    },
    {
      title: "Revenue",
      value: dashboardData?.revenue || "$42,850",
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
          <StatsCard
            key={stat.title}
            {...stat}
            loading={isLoading}
            error={Boolean(error)}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <AttendanceChart loading={isLoading} error={error} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Academic Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <PerformanceChart loading={isLoading} error={error} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentActivity loading={isLoading} error={error} />
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardOverview;
