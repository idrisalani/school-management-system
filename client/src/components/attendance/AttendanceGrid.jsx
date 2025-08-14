// @ts-nocheck

// client/src/components/attendance/AttendanceGrid.jsx
import React, { useState, useMemo } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  MoreHorizontal,
  Calendar,
  Users,
} from "lucide-react";

/**
 * Attendance Grid component for marking student attendance
 * @param {object} props - Component props
 * @param {string} props.date - Selected date for attendance
 * @param {string} props.classId - Selected class ID
 * @param {string} props.view - View mode (grid, list, compact)
 * @param {Function} props.onUpdate - Callback function when attendance is updated
 * @returns {React.ReactElement} AttendanceGrid component
 */
const AttendanceGrid = ({ date, classId, view = "grid", onUpdate }) => {
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [students, setStudents] = useState([
    {
      id: 1,
      name: "John Doe",
      rollNo: "001",
      status: "present",
      classId: "10A",
      timestamp: "9:00 AM",
    },
    {
      id: 2,
      name: "Jane Smith",
      rollNo: "002",
      status: "absent",
      classId: "10A",
      timestamp: null,
    },
    {
      id: 3,
      name: "Mike Johnson",
      rollNo: "003",
      status: "late",
      classId: "10A",
      timestamp: "9:15 AM",
    },
    {
      id: 4,
      name: "Sarah Wilson",
      rollNo: "004",
      status: "present",
      classId: "10B",
      timestamp: "9:02 AM",
    },
    {
      id: 5,
      name: "Tom Brown",
      rollNo: "005",
      status: "absent",
      classId: "10B",
      timestamp: null,
    },
    {
      id: 6,
      name: "Lisa Garcia",
      rollNo: "006",
      status: "late",
      classId: "10A",
      timestamp: "9:20 AM",
    },
  ]);

  // Filter students based on selected class
  const filteredStudents = useMemo(() => {
    if (!classId || classId === "all") {
      return students;
    }
    return students.filter((student) => student.classId === classId);
  }, [students, classId]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Today";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "present":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "absent":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "late":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "present":
        return "bg-green-50 text-green-700 border-green-200";
      case "absent":
        return "bg-red-50 text-red-700 border-red-200";
      case "late":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const handleStatusChange = (studentId, newStatus) => {
    const timestamp =
      newStatus === "absent"
        ? null
        : newStatus === "late"
          ? "9:20 AM"
          : "9:00 AM";

    // Update local state
    setStudents((prevStudents) =>
      prevStudents.map((student) =>
        student.id === studentId
          ? { ...student, status: newStatus, timestamp }
          : student
      )
    );

    // Close dropdown
    setDropdownOpen(null);

    // Call parent callback if provided
    if (onUpdate) {
      onUpdate(studentId, newStatus);
    }
  };

  const toggleDropdown = (studentId) => {
    setDropdownOpen(dropdownOpen === studentId ? null : studentId);
  };

  // Get attendance summary
  const attendanceSummary = useMemo(() => {
    const total = filteredStudents.length;
    const present = filteredStudents.filter(
      (s) => s.status === "present"
    ).length;
    const absent = filteredStudents.filter((s) => s.status === "absent").length;
    const late = filteredStudents.filter((s) => s.status === "late").length;

    return { total, present, absent, late };
  }, [filteredStudents]);

  // Render based on view mode
  const renderContent = () => {
    if (view === "compact") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className="p-4 border rounded-lg bg-white hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{student.name}</p>
                  <p className="text-sm text-gray-500">
                    Roll No: {student.rollNo}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(student.status)}`}
                  >
                    {getStatusIcon(student.status)}
                    <span className="ml-1 capitalize">{student.status}</span>
                  </span>
                  <div className="relative">
                    <button
                      onClick={() => toggleDropdown(student.id)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    {dropdownOpen === student.id && (
                      <div className="absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                        <div className="py-1">
                          {["present", "absent", "late"].map((status) => (
                            <button
                              key={status}
                              onClick={() =>
                                handleStatusChange(student.id, status)
                              }
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left capitalize"
                            >
                              Mark as {status}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {student.timestamp && (
                <p className="text-xs text-gray-400 mt-2">
                  Time: {student.timestamp}
                </p>
              )}
            </div>
          ))}
        </div>
      );
    }

    // Default grid/table view
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Roll No
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Student Name
              </th>
              {classId === "all" && (
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Class
                </th>
              )}
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Time
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredStudents.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {student.rollNo}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {student.name}
                </td>
                {classId === "all" && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.classId}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(student.status)}`}
                    >
                      {getStatusIcon(student.status)}
                      <span className="ml-1 capitalize">{student.status}</span>
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {student.timestamp || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="relative inline-block text-left">
                    <button
                      onClick={() => toggleDropdown(student.id)}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                    {dropdownOpen === student.id && (
                      <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                        <div className="py-1">
                          {["present", "absent", "late"].map((status) => (
                            <button
                              key={status}
                              onClick={() =>
                                handleStatusChange(student.id, status)
                              }
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left capitalize"
                            >
                              Mark as {status}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with date and class info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-lg border">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-900">
              {formatDate(date)}
            </span>
          </div>
          {classId && classId !== "all" && (
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-600">Class {classId}</span>
            </div>
          )}
        </div>

        {/* Attendance Summary */}
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-1">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            <span className="text-gray-600">
              Present: {attendanceSummary.present}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-3 h-3 bg-red-500 rounded-full"></span>
            <span className="text-gray-600">
              Absent: {attendanceSummary.absent}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
            <span className="text-gray-600">
              Late: {attendanceSummary.late}
            </span>
          </div>
          <span className="text-gray-900 font-medium">
            Total: {attendanceSummary.total}
          </span>
        </div>
      </div>

      {/* Main Content */}
      {filteredStudents.length > 0 ? (
        renderContent()
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {classId && classId !== "all"
              ? `No students found for class ${classId}`
              : "No students found"}
          </p>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {dropdownOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setDropdownOpen(null)}
        />
      )}
    </div>
  );
};

export default AttendanceGrid;
