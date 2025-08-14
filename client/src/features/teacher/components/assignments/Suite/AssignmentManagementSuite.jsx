// @ts-nocheck
// client/src/features/teacher/components/assignments/Suite/AssignmentManagementSuite.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Grid,
  List,
  BarChart2,
  Settings,
  Plus,
  Calendar,
  TrendingUp,
  Users,
  Clock,
  Award,
} from "lucide-react";

// Components
import AssignmentList from "../List/AssignmentList";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAssignment } from "../hooks/useAssignment";
import { useAnalytics } from "../hooks/useAnalytics";

const AssignmentManagementSuite = () => {
  const navigate = useNavigate();
  const [view, setView] = useState("list");
  const [selectedAssignments, setSelectedAssignments] = useState([]);
  const [filters, setFilters] = useState({
    status: "all",
    class: "all",
    date: "all",
  });

  const { assignments, loading, error, fetchAssignments, bulkUpdateStatus } =
    useAssignment();
  const { analyticsData, fetchAnalytics } = useAnalytics();

  // Memoize fetch functions to avoid useEffect dependency issues
  const memoizedFetchAssignments = useCallback(() => {
    if (typeof fetchAssignments === "function") {
      fetchAssignments();
    }
  }, [fetchAssignments]);

  const memoizedFetchAnalytics = useCallback(() => {
    if (typeof fetchAnalytics === "function") {
      fetchAnalytics();
    }
  }, [fetchAnalytics]);

  // Fetch initial data
  useEffect(() => {
    memoizedFetchAssignments();
    memoizedFetchAnalytics();
  }, [memoizedFetchAssignments, memoizedFetchAnalytics]);

  const views = [
    { id: "list", name: "List View", icon: List },
    { id: "grid", name: "Grid View", icon: Grid },
    { id: "calendar", name: "Calendar", icon: Calendar },
    { id: "analytics", name: "Analytics", icon: BarChart2 },
  ];

  const quickStats = [
    {
      title: "Total Assignments",
      value: assignments?.length || 0,
      change: "+5%",
      color: "blue",
      icon: List,
    },
    {
      title: "Active Assignments",
      value: assignments?.filter((a) => a.status === "active").length || 0,
      change: "+2%",
      color: "green",
      icon: Users,
    },
    {
      title: "Pending Grading",
      value: assignments?.filter((a) => a.needsGrading).length || 0,
      change: "-3%",
      color: "yellow",
      icon: Clock,
    },
    {
      title: "Average Completion",
      value: analyticsData?.averageCompletion || "87%",
      change: analyticsData?.completionTrend || "+4%",
      color: "purple",
      icon: Award,
    },
  ];

  const handleCreateAssignment = () => {
    navigate("/assignments/create");
  };

  const handleViewChange = (newView) => {
    setView(newView);
    setSelectedAssignments([]);
  };

  const handleFilterChange = useCallback(
    (newFilters) => {
      setFilters(newFilters);
      if (typeof fetchAssignments === "function") {
        fetchAssignments(newFilters);
      }
    },
    [fetchAssignments]
  );

  const handleBulkAction = async (action) => {
    if (!selectedAssignments.length) return;

    try {
      switch (action) {
        case "archive":
          if (typeof bulkUpdateStatus === "function") {
            await bulkUpdateStatus(selectedAssignments, "archived");
          }
          break;
        case "delete":
          // Handle delete
          console.log("Delete action for:", selectedAssignments);
          break;
        case "export":
          // Handle export
          console.log("Export action for:", selectedAssignments);
          break;
        default:
          console.warn("Unknown action:", action);
      }
      setSelectedAssignments([]);
      if (typeof fetchAssignments === "function") {
        fetchAssignments(filters);
      }
    } catch (error) {
      console.error("Bulk action failed:", error);
    }
  };

  // Analytics View Component
  const AnalyticsView = () => (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">
        Assignment Analytics
      </h2>

      {/* Analytics Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-sm font-medium text-gray-500">
              Completion Rate
            </h3>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingUp className="h-6 w-6 text-green-500 mr-2" />
              <span className="text-2xl font-bold text-gray-900">
                {analyticsData?.completionRate || "92%"}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {analyticsData?.completionTrend || "+8% from last month"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-sm font-medium text-gray-500">Average Grade</h3>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Award className="h-6 w-6 text-blue-500 mr-2" />
              <span className="text-2xl font-bold text-gray-900">
                {analyticsData?.averageGrade || "85%"}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {analyticsData?.gradeTrend || "+2% from last month"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-sm font-medium text-gray-500">
              Late Submissions
            </h3>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="h-6 w-6 text-orange-500 mr-2" />
              <span className="text-2xl font-bold text-gray-900">
                {analyticsData?.lateSubmissions || "12"}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {analyticsData?.lateTrend || "-15% from last month"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Analytics Content */}
      {analyticsData?.chartData && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">
              Performance Trends
            </h3>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <BarChart2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Chart visualization would be rendered here</p>
                <p className="text-sm mt-2">
                  Using data from analyticsData.chartData
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Grid View Component
  const GridView = () => (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Assignment Grid
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignments?.map((assignment, index) => (
          <Card
            key={assignment.id || index}
            className="hover:shadow-md transition-shadow"
          >
            <CardHeader>
              <h3 className="font-medium text-gray-900">
                {assignment.title || "Untitled Assignment"}
              </h3>
              <p className="text-sm text-gray-500">
                {assignment.subject || "No Subject"}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Due Date:</span>
                  <span className="text-gray-900">
                    {assignment.dueDate || "No due date"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status:</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      assignment.status === "active"
                        ? "bg-green-100 text-green-800"
                        : assignment.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {assignment.status || "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Submissions:</span>
                  <span className="text-gray-900">
                    {assignment.submissions || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!assignments || assignments.length === 0) && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Grid className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No assignments to display</p>
          </div>
        )}
      </div>
    </div>
  );

  // Calendar View Component
  const CalendarView = () => (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Assignment Calendar
      </h2>
      <div className="h-64 flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
        <div className="text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Calendar view would be implemented here</p>
          <p className="text-sm mt-2">
            Showing assignment due dates and schedules
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
          <p className="text-sm text-gray-500">
            Manage and track all your assignments
          </p>
        </div>
        <button
          onClick={handleCreateAssignment}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Create Assignment
        </button>
      </div>

      {/* View Selector and Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center space-x-2">
          {views.map((viewOption) => (
            <button
              key={viewOption.id}
              onClick={() => handleViewChange(viewOption.id)}
              className={`inline-flex items-center px-3 py-2 rounded-lg transition-colors ${
                view === viewOption.id
                  ? "bg-blue-50 text-blue-600 ring-2 ring-blue-500 ring-opacity-20"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <viewOption.icon size={20} className="mr-2" />
              {viewOption.name}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate("/assignments/settings")}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg bg-${stat.color}-100`}>
                    <IconComponent
                      className={`h-6 w-6 text-${stat.color}-600`}
                    />
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      stat.change.startsWith("+")
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {stat.change}
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-500">
                    {stat.title}
                  </h3>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading assignments...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">
            <p>{error}</p>
          </div>
        ) : (
          <>
            {view === "list" && (
              <AssignmentList
                assignments={assignments}
                selectedAssignments={selectedAssignments}
                onSelectionChange={setSelectedAssignments}
                onFilterChange={handleFilterChange}
                onBulkAction={handleBulkAction}
              />
            )}
            {view === "grid" && <GridView />}
            {view === "calendar" && <CalendarView />}
            {view === "analytics" && <AnalyticsView />}
          </>
        )}
      </div>

      {/* Footer Actions */}
      {selectedAssignments.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedAssignments.length} assignment
              {selectedAssignments.length !== 1 ? "s" : ""} selected
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction("archive")}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Archive
              </button>
              <button
                onClick={() => handleBulkAction("export")}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Export
              </button>
              <button
                onClick={() => handleBulkAction("delete")}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentManagementSuite;
