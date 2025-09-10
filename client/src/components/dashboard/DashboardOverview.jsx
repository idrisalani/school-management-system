// @ts-nocheck
// client/src/components/dashboard/DashboardOverview.jsx - Enhanced with Better Auth & Assignment Integration
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import {
  Users,
  GraduationCap,
  Clock,
  CreditCard,
  Settings,
  Bell,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  FileText,
  CheckCircle,
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
//import StatsCard from "./StatsCard";
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

// Enhanced Loading Component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-2 text-gray-500">Loading dashboard data...</span>
  </div>
);

// Error Component
const ErrorDisplay = ({ error, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-8 text-center">
    <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">
      Unable to Load Dashboard
    </h3>
    <p className="text-gray-500 mb-4">{error}</p>
    <Button onClick={onRetry} variant="outline" size="sm">
      <RefreshCw className="h-4 w-4 mr-2" />
      Try Again
    </Button>
  </div>
);

// Authentication Required Component
const AuthRequired = () => (
  <Card>
    <CardContent className="py-8">
      <div className="text-center">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Authentication Required
        </h3>
        <p className="text-gray-500">
          Please log in to view your dashboard data
        </p>
      </div>
    </CardContent>
  </Card>
);

// Enhanced Stats Card with Assignment Data
const EnhancedStatsCard = ({
  title,
  value,
  change,
  trend,
  icon: IconComponent,
  color,
  loading,
  onClick,
  subtitle,
  timeframe = "vs last month",
}) => (
  <Card
    className="hover:shadow-md transition-shadow cursor-pointer"
    onClick={onClick}
  >
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-lg bg-${color}-100`}>
          <IconComponent className={`h-6 w-6 text-${color}-600`} />
        </div>
        <div
          className={`flex items-center space-x-1 text-sm ${
            trend === "up"
              ? "text-green-600"
              : trend === "down"
                ? "text-red-600"
                : "text-gray-600"
          }`}
        >
          {trend === "up" && <TrendingUp className="h-4 w-4" />}
          {trend === "down" && <TrendingDown className="h-4 w-4" />}
          <span>{change}</span>
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="mt-2 text-3xl font-semibold">
          {loading ? (
            <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
          ) : (
            value
          )}
        </p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
    </CardContent>
  </Card>
);

// Quick Actions Component for Teachers
const QuickActions = ({ userRole, onAction }) => {
  const teacherActions = [
    {
      id: "create-assignment",
      label: "Create Assignment",
      icon: FileText,
      color: "blue",
    },
    {
      id: "grade-submissions",
      label: "Grade Submissions",
      icon: CheckCircle,
      color: "green",
    },
    {
      id: "view-analytics",
      label: "View Analytics",
      icon: TrendingUp,
      color: "purple",
    },
  ];

  const studentActions = [
    {
      id: "view-assignments",
      label: "View Assignments",
      icon: FileText,
      color: "blue",
    },
    {
      id: "check-grades",
      label: "Check Grades",
      icon: TrendingUp,
      color: "green",
    },
    { id: "attendance", label: "Attendance", icon: Clock, color: "orange" },
  ];

  const actions =
    userRole === "teacher"
      ? teacherActions
      : userRole === "student"
        ? studentActions
        : [];

  if (actions.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="h-5 w-5" />
          <span>Quick Actions</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant="outline"
              onClick={() => onAction(action.id)}
              className="justify-start h-12"
            >
              <action.icon
                className={`h-4 w-4 mr-2 text-${action.color}-600`}
              />
              {action.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const DashboardOverview = ({ userRole = "admin", userId, onNavigate }) => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();

  // State Management
  const [dashboardData, setDashboardData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Reset error on retry
  const handleRetry = useCallback(() => {
    setError(null);
    setRetryCount((prev) => prev + 1);
  }, []);

  // Fetch Dashboard Data with Enhanced Error Handling
  const fetchDashboardData = useCallback(async () => {
    // Wait for auth to complete
    if (authLoading) {
      console.log("🔄 DashboardOverview: Auth loading, waiting...");
      return;
    }

    // Check authentication
    if (!isAuthenticated || !user) {
      console.log(
        "🔒 DashboardOverview: User not authenticated, using fallback data"
      );
      setIsLoading(false);
      setDashboardData({
        studentCount: "0",
        teacherCount: "0",
        activeAssignments: "0",
        pendingGrades: "0",
        averageAttendance: "0%",
        revenue: "$0",
        completedAssignments: "0",
        upcomingDeadlines: "0",
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
          userId: user.id,
          userEmail: user.email,
        }
      );

      let data;

      // Enhanced data fetching with timeout
      const fetchWithTimeout = (promise, timeout = 10000) => {
        return Promise.race([
          promise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Request timeout")), timeout)
          ),
        ]);
      };

      switch (userRole) {
        case "admin":
          data = await fetchWithTimeout(getAdminDashboardData());
          break;
        case "teacher":
          data = await fetchWithTimeout(
            getTeacherDashboardData(userId || user.id)
          );
          break;
        case "student":
          data = await fetchWithTimeout(
            getStudentDashboardData(userId || user.id)
          );
          break;
        case "parent":
          data = await fetchWithTimeout(
            getParentDashboardData(userId || user.id)
          );
          break;
        default:
          data = await fetchWithTimeout(getAdminDashboardData());
      }

      setDashboardData(data);
      setLastUpdate(new Date());
      setRetryCount(0);
      console.log("✅ DashboardOverview: Data fetched successfully");
    } catch (err) {
      console.error(
        "❌ DashboardOverview: Failed to fetch dashboard data:",
        err
      );

      let errorMessage = "Failed to load dashboard data";

      if (err.message === "Request timeout") {
        errorMessage = "Request timed out. Please check your connection.";
      } else if (err.response?.status === 401) {
        errorMessage = "Authentication expired. Please log in again.";
      } else if (err.response?.status === 403) {
        errorMessage = "You don't have permission to view this data.";
      } else if (err.response?.status >= 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (!navigator.onLine) {
        errorMessage = "No internet connection. Please check your network.";
      }

      setError(errorMessage);

      // Enhanced fallback data based on user role
      const fallbackData = {
        admin: {
          studentCount: "2,856",
          teacherCount: "145",
          activeAssignments: "324",
          pendingGrades: "89",
          averageAttendance: "92.8%",
          revenue: "$42,850",
        },
        teacher: {
          totalStudents: "85",
          totalClasses: "6",
          activeAssignments: "12",
          pendingGrades: "23",
          averageGrade: "B+",
          attendanceRate: "94%",
          completedAssignments: "45",
          upcomingDeadlines: "3",
        },
        student: {
          totalAssignments: "15",
          completed: "12",
          pending: "3",
          averageGrade: "A-",
          attendance: "96%",
          upcomingDeadlines: "2",
        },
        parent: {
          children: "2",
          totalAssignments: "8",
          averageGrade: "B+",
          attendance: "94%",
          upcomingEvents: "3",
        },
      };

      setDashboardData(fallbackData[userRole] || fallbackData.admin);
    } finally {
      setIsLoading(false);
    }
  }, [userRole, userId, isAuthenticated, user, authLoading]);

  // Fetch Notifications
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !user || authLoading) {
      setNotifications([]);
      return;
    }

    try {
      console.log("🔔 DashboardOverview: Fetching notifications");
      const notificationData = await getNotifications(5, true);
      setNotifications(notificationData);
    } catch (err) {
      console.error(
        "❌ DashboardOverview: Failed to fetch notifications:",
        err
      );
      // Fallback notifications for demo
      setNotifications([
        {
          title: "New Assignment Due",
          message: "Mathematics homework is due tomorrow",
          time: "2 hours ago",
          type: "warning",
        },
        {
          title: "Grade Updated",
          message: "Your English essay has been graded",
          time: "1 day ago",
          type: "info",
        },
      ]);
    }
  }, [isAuthenticated, user, authLoading]);

  // Effects
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Handle quick actions
  const handleQuickAction = useCallback(
    (actionId) => {
      console.log("Quick action:", actionId);
      if (onNavigate) {
        onNavigate(actionId);
      }
    },
    [onNavigate]
  );

  // Handle stat card clicks
  const handleStatCardClick = useCallback((statType) => {
    setSelectedMetric(statType);
  }, []);

  // Loading state during auth
  if (authLoading) {
    return <LoadingSpinner />;
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <AuthRequired />;
  }

  // Error state with retry
  if (error && !dashboardData) {
    return <ErrorDisplay error={error} onRetry={handleRetry} />;
  }

  // Generate stats based on user role and data
  const generateStats = () => {
    const baseStats = {
      admin: [
        {
          title: "Total Students",
          value: dashboardData?.studentCount || "0",
          change: "+12.5%",
          trend: "up",
          icon: Users,
          color: "blue",
          subtitle: "Active enrollments",
        },
        {
          title: "Total Teachers",
          value: dashboardData?.teacherCount || "0",
          change: "+4.3%",
          trend: "up",
          icon: GraduationCap,
          color: "green",
          subtitle: "Faculty members",
        },
        {
          title: "Active Assignments",
          value: dashboardData?.activeAssignments || "0",
          change: "+8.2%",
          trend: "up",
          icon: FileText,
          color: "purple",
          subtitle: "Currently active",
        },
        {
          title: "Revenue",
          value: dashboardData?.revenue || "$0",
          change: "+8.7%",
          trend: "up",
          icon: CreditCard,
          color: "orange",
          subtitle: "Monthly total",
        },
      ],
      teacher: [
        {
          title: "Total Students",
          value: dashboardData?.totalStudents || "0",
          change: "+5.2%",
          trend: "up",
          icon: Users,
          color: "blue",
          subtitle: "In your classes",
        },
        {
          title: "Active Assignments",
          value: dashboardData?.activeAssignments || "0",
          change: "+2",
          trend: "up",
          icon: FileText,
          color: "green",
          subtitle: "Currently active",
        },
        {
          title: "Pending Grades",
          value: dashboardData?.pendingGrades || "0",
          change: "-5",
          trend: "down",
          icon: Clock,
          color: "orange",
          subtitle: "Need attention",
        },
        {
          title: "Class Average",
          value: dashboardData?.averageGrade || "N/A",
          change: "+0.3",
          trend: "up",
          icon: TrendingUp,
          color: "purple",
          subtitle: "Overall performance",
        },
      ],
      student: [
        {
          title: "Total Assignments",
          value: dashboardData?.totalAssignments || "0",
          change: "+2",
          trend: "up",
          icon: FileText,
          color: "blue",
          subtitle: "This semester",
        },
        {
          title: "Completed",
          value: dashboardData?.completed || "0",
          change: "+3",
          trend: "up",
          icon: CheckCircle,
          color: "green",
          subtitle: "Submitted on time",
        },
        {
          title: "Current Grade",
          value: dashboardData?.averageGrade || "N/A",
          change: "+0.2",
          trend: "up",
          icon: TrendingUp,
          color: "purple",
          subtitle: "Overall average",
        },
        {
          title: "Attendance",
          value: dashboardData?.attendance || "0%",
          change: "-1%",
          trend: "down",
          icon: Clock,
          color: "orange",
          subtitle: "This month",
        },
      ],
    };

    return baseStats[userRole] || baseStats.admin;
  };

  const stats = generateStats();

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
          {error && (
            <p className="text-sm text-amber-600 mt-1">
              {retryCount > 0
                ? `⚠️ Retry attempt ${retryCount} - Showing cached data due to connection issues`
                : `⚠️ Showing cached data due to connection issues`}
            </p>
          )}
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
                      <div className="flex items-start space-x-2">
                        {notification.type === "warning" ? (
                          <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                        ) : (
                          <Bell className="h-4 w-4 text-blue-500 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{notification.title}</p>
                          <p className="text-sm text-gray-600">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {notification.time}
                          </p>
                        </div>
                      </div>
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
            disabled={isLoading}
            size="sm"
            variant={error ? "destructive" : "default"}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            {error ? "Retry" : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <EnhancedStatsCard
            key={stat.title}
            {...stat}
            loading={isLoading}
            onClick={() => handleStatCardClick(stat.title)}
          />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Charts Section */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="charts" className="space-y-6">
            <TabsList>
              <TabsTrigger value="charts">Charts & Analytics</TabsTrigger>
              <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="charts" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Attendance Trends
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AttendanceChart
                      loading={isLoading}
                      error={Boolean(error)}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Academic Performance
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PerformanceChart
                      loading={isLoading}
                      error={Boolean(error)}
                    />
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
                  <RecentActivity loading={isLoading} error={Boolean(error)} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <QuickActions userRole={userRole} onAction={handleQuickAction} />

          {/* Assignment Summary for Teachers */}
          {userRole === "teacher" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Assignment Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Active</span>
                    <span className="font-medium">
                      {dashboardData?.activeAssignments || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Pending Grades
                    </span>
                    <span className="font-medium text-orange-600">
                      {dashboardData?.pendingGrades || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Completed</span>
                    <span className="font-medium text-green-600">
                      {dashboardData?.completedAssignments || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

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
