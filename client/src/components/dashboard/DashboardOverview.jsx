// @ts-nocheck

// FIXED: components/dashboard/DashboardOverview.jsx - Prevent unauthorized API calls
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext.jsx"; // Add this import
import {
  Users,
  GraduationCap,
  Clock,
  CreditCard,
  Settings,
  Bell,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import StatsCard from "./StatsCard";
import AttendanceChart from "./AttendanceChart";
import RecentActivity from "./RecentActivity";
import PerformanceChart from "./PerformanceChart";
import {
  getAdminDashboardData,
  getNotifications,
  getTeacherDashboardData,
  getStudentDashboardData,
  getParentDashboardData,
} from "../../services/dashboardApi";

const DashboardOverview = ({ userRole = "admin", userId }) => {
  const { isAuthenticated, user } = useAuth(); // Add auth context
  const [dashboardData, setDashboardData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [selectedMetric, setSelectedMetric] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    // FIXED: Only fetch data if user is authenticated
    if (!isAuthenticated || !user) {
      console.log(
        "🔒 DashboardOverview: User not authenticated, skipping API calls"
      );
      setIsLoading(false);
      setDashboardData({
        studentCount: "0",
        teacherCount: "0",
        averageAttendance: "0%",
        revenue: "$0",
      });
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log(
        "📊 DashboardOverview: Fetching data for authenticated user:",
        {
          userRole,
          userId,
          isAuthenticated,
        }
      );

      let data;
      switch (userRole) {
        case "admin":
          data = await getAdminDashboardData();
          break;
        case "teacher":
          data = await getTeacherDashboardData(userId);
          break;
        case "student":
          data = await getStudentDashboardData(userId);
          break;
        case "parent":
          data = await getParentDashboardData(userId);
          break;
        default:
          data = await getAdminDashboardData();
      }

      setDashboardData(data);
      setLastUpdate(new Date());
      console.log("✅ DashboardOverview: Data fetched successfully");
    } catch (err) {
      console.error(
        "❌ DashboardOverview: Failed to fetch dashboard data:",
        err
      );
      setError(err.message);

      // Fallback data for demo purposes
      setDashboardData({
        studentCount: "2,856",
        teacherCount: "145",
        averageAttendance: "92.8%",
        revenue: "$42,850",
      });
    } finally {
      setIsLoading(false);
    }
  }, [userRole, userId, isAuthenticated, user]);

  const fetchNotifications = useCallback(async () => {
    // FIXED: Only fetch notifications if user is authenticated
    if (!isAuthenticated || !user) {
      console.log(
        "🔒 DashboardOverview: User not authenticated, skipping notifications"
      );
      setNotifications([]);
      return;
    }

    try {
      console.log(
        "🔔 DashboardOverview: Fetching notifications for authenticated user"
      );
      const notificationData = await getNotifications(5, true);
      setNotifications(notificationData);
      console.log("✅ DashboardOverview: Notifications fetched successfully");
    } catch (err) {
      console.error(
        "❌ DashboardOverview: Failed to fetch notifications:",
        err
      );
      // Don't set error state for notifications, just log and continue
      setNotifications([]);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    // FIXED: Add authentication check before making any API calls
    if (isAuthenticated && user) {
      fetchDashboardData();
      fetchNotifications();
    } else {
      console.log("🔒 DashboardOverview: Waiting for authentication...");
      setIsLoading(false);
      setDashboardData({
        studentCount: "0",
        teacherCount: "0",
        averageAttendance: "0%",
        revenue: "$0",
      });
      setNotifications([]);
    }

    // Listen for refresh events
    const handleRefresh = () => {
      if (isAuthenticated && user) {
        fetchDashboardData();
      }
    };

    window.addEventListener("dashboard-refresh", handleRefresh);

    return () => window.removeEventListener("dashboard-refresh", handleRefresh);
  }, [fetchDashboardData, fetchNotifications, isAuthenticated, user]);

  const handleStatCardClick = (statType) => {
    setSelectedMetric(statType);
  };

  // FIXED: Show appropriate message when not authenticated
  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-gray-500">Please log in to view dashboard data</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Total Students",
      value: dashboardData?.studentCount || "0",
      change: "+12.5%",
      trend: "up",
      icon: Users,
      color: "blue",
      subtitle: "Active enrollments",
      timeframe: "vs last month",
    },
    {
      title: "Total Teachers",
      value: dashboardData?.teacherCount || "0",
      change: "+4.3%",
      trend: "up",
      icon: GraduationCap,
      color: "green",
      subtitle: "Faculty members",
      timeframe: "vs last month",
    },
    {
      title: "Average Attendance",
      value: dashboardData?.averageAttendance || "0%",
      change: "-2.1%",
      trend: "down",
      icon: Clock,
      color: "orange",
      subtitle: "Daily average",
      timeframe: "vs last month",
    },
    {
      title: "Revenue",
      value: dashboardData?.revenue || "$0",
      change: "+8.7%",
      trend: "up",
      icon: CreditCard,
      color: "purple",
      subtitle: "Monthly total",
      timeframe: "vs last month",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Dashboard Overview
          </h2>
          <p className="text-sm text-gray-500">
            Last updated: {lastUpdate.toLocaleString()}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Notifications */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Recent Notifications</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notification, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <p className="font-medium">{notification.title}</p>
                      <p className="text-sm text-gray-600">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {notification.time}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">
                    No new notifications
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Settings */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dashboard Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Auto-refresh interval
                  </label>
                  <select className="w-full border-gray-200 rounded-lg text-sm">
                    <option value="never">Never</option>
                    <option value="5">Every 5 minutes</option>
                    <option value="15">Every 15 minutes</option>
                    <option value="30">Every 30 minutes</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2 rounded border-gray-300"
                    />
                    <span className="text-sm">Show detailed tooltips</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2 rounded border-gray-300"
                    />
                    <span className="text-sm">Enable sound notifications</span>
                  </label>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            onClick={fetchDashboardData}
            disabled={isLoading || !isAuthenticated}
            size="sm"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards with Enhanced Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatsCard
            key={stat.title}
            {...stat}
            loading={isLoading}
            error={Boolean(error)}
            onClick={() => handleStatCardClick(stat.title)}
            onRefresh={fetchDashboardData}
            showMenu={true}
          />
        ))}
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="charts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="charts">Charts & Analytics</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Attendance Trends
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => console.log("View detailed attendance")}
                  >
                    View Details
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AttendanceChart loading={isLoading} error={error} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Academic Performance
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => console.log("View detailed performance")}
                  >
                    View Details
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PerformanceChart loading={isLoading} error={error} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentActivity loading={isLoading} error={error} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Quick Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20 flex flex-col">
                  <span className="font-medium">Attendance Report</span>
                  <span className="text-xs text-gray-500">Monthly summary</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col">
                  <span className="font-medium">Grade Report</span>
                  <span className="text-xs text-gray-500">
                    Academic performance
                  </span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col">
                  <span className="font-medium">Financial Report</span>
                  <span className="text-xs text-gray-500">
                    Revenue & expenses
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Metric Detail Modal */}
      {selectedMetric && (
        <Dialog
          open={!!selectedMetric}
          onOpenChange={() => setSelectedMetric(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedMetric} Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>
                Detailed information about {selectedMetric} would be displayed
                here.
              </p>
              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-500">
                  Detailed chart/data for {selectedMetric}
                </span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default DashboardOverview;
