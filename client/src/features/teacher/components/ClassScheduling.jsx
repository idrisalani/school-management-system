// @ts-nocheck
// src/features/teacher/components/ClassScheduling.jsx
import React, { useState, useCallback, useMemo } from "react";
import {
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Copy,
  Download,
  MapPin,
  Users,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../../components/ui/card";
import ClassModal from "./ClassModal";

/**
 * @typedef {object} ClassData
 * @property {number} id - Unique identifier for the class
 * @property {string} subject - Subject name or title
 * @property {string} class - Class name or section
 * @property {string} teacher - Assigned teacher name
 * @property {string} room - Room number or location
 * @property {string} day - Day of the week
 * @property {string} startTime - Class start time
 * @property {number} duration - Class duration in minutes
 * @property {string} color - Color theme for the class
 */

const ClassScheduling = () => {
  // State Management
  const [selectedView, setSelectedView] = useState("week");
  const [selectedClass, setSelectedClass] = useState("all");
  const [showConflicts, setShowConflicts] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);

  // Constants - wrapped in useMemo to prevent unnecessary re-renders
  const timeSlots = useMemo(
    () => [
      "8:00 AM",
      "9:00 AM",
      "10:00 AM",
      "11:00 AM",
      "12:00 PM",
      "1:00 PM",
      "2:00 PM",
      "3:00 PM",
    ],
    []
  );

  const weekDays = useMemo(
    () => ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    []
  );

  const [classes, setClasses] = useState([
    {
      id: 1,
      subject: "Mathematics",
      class: "10A",
      teacher: "Mr. Johnson",
      room: "201",
      day: "Monday",
      startTime: "8:00 AM",
      duration: 60,
      color: "blue",
    },
    {
      id: 2,
      subject: "Physics",
      class: "10A",
      teacher: "Mrs. Smith",
      room: "301",
      day: "Monday",
      startTime: "9:00 AM",
      duration: 60,
      color: "green",
    },
  ]);

  const [rooms] = useState([
    {
      id: "201",
      name: "Room 201",
      capacity: 35,
      features: ["projector", "whiteboard"],
      availability: {
        Monday: true,
        Tuesday: true,
        Wednesday: false,
        Thursday: true,
        Friday: true,
      },
    },
    {
      id: "301",
      name: "Room 301",
      capacity: 30,
      features: ["lab", "smartboard"],
      availability: {
        Monday: false,
        Tuesday: true,
        Wednesday: true,
        Thursday: true,
        Friday: true,
      },
    },
  ]);

  // Utility Functions
  const getColorClass = useCallback((color) => {
    const colors = {
      blue: "bg-blue-50 border-blue-200",
      green: "bg-green-50 border-green-200",
      purple: "bg-purple-50 border-purple-200",
      orange: "bg-orange-50 border-orange-200",
    };
    return colors[color] || colors.blue;
  }, []);

  const timeToMinutes = useCallback((timeStr) => {
    const [time, period] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }, []);

  // Class Management Functions
  const checkConflicts = useCallback(
    (newClass, existingClasses) => {
      return existingClasses.filter((existing) => {
        if (existing.id === newClass.id) return false;
        if (existing.day !== newClass.day) return false;

        const existingStart = timeToMinutes(existing.startTime);
        const existingEnd = existingStart + existing.duration;
        const newStart = timeToMinutes(newClass.startTime);
        const newEnd = newStart + newClass.duration;

        const hasTimeConflict =
          (newStart >= existingStart && newStart < existingEnd) ||
          (newEnd > existingStart && newEnd <= existingEnd) ||
          (newStart <= existingStart && newEnd >= existingEnd);

        const hasRoomConflict = existing.room === newClass.room;
        const hasClassConflict = existing.class === newClass.class;
        const hasTeacherConflict = existing.teacher === newClass.teacher;

        return (
          hasTimeConflict &&
          (hasRoomConflict || hasClassConflict || hasTeacherConflict)
        );
      });
    },
    [timeToMinutes]
  );

  const handleAddClass = useCallback(() => {
    setEditingClass(null);
    setModalOpen(true);
  }, []);

  const handleEditClass = useCallback(
    (classId) => {
      const classToEdit = classes.find((c) => c.id === classId);
      if (classToEdit) {
        setEditingClass(classToEdit);
        setModalOpen(true);
      }
    },
    [classes]
  );

  const handleDeleteClass = useCallback((classId) => {
    if (window.confirm("Are you sure you want to delete this class?")) {
      setClasses((prevClasses) => prevClasses.filter((c) => c.id !== classId));
    }
  }, []);

  const handleSaveClass = useCallback(
    (classData) => {
      const conflicts = checkConflicts(classData, classes);

      if (conflicts.length > 0) {
        const conflictMessages = conflicts.map(
          (conflict) =>
            `Conflict with ${conflict.subject} (${conflict.day} at ${conflict.startTime})`
        );
        alert(`Schedule conflicts found:\n${conflictMessages.join("\n")}`);
        return;
      }

      setClasses((prevClasses) => {
        if (classData.id && prevClasses.some((c) => c.id === classData.id)) {
          return prevClasses.map((c) =>
            c.id === classData.id ? classData : c
          );
        }
        return [...prevClasses, { ...classData, id: Date.now() }];
      });

      setModalOpen(false);
      setEditingClass(null);
    },
    [classes, checkConflicts]
  );

  const handleExportSchedule = useCallback(() => {
    const scheduleData = {
      classes,
      timeSlots,
      weekDays,
    };

    const blob = new Blob([JSON.stringify(scheduleData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "class-schedule.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [classes, timeSlots, weekDays]);

  const handleCopySchedule = useCallback(() => {
    const scheduleText = classes
      .map(
        (c) =>
          `${c.subject} - ${c.class} - ${c.day} ${c.startTime} (Room ${c.room})`
      )
      .join("\n");

    navigator.clipboard
      .writeText(scheduleText)
      .then(() => {
        alert("Schedule copied to clipboard!");
      })
      .catch(() => {
        alert("Failed to copy schedule to clipboard");
      });
  }, [classes]);

  // Filtering
  const filteredClasses = useMemo(() => {
    return selectedClass === "all"
      ? classes
      : classes.filter((c) => c.class === selectedClass);
  }, [classes, selectedClass]);

  return (
    <div className="space-y-6">
      {/* Controls Section */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <select
            value={selectedView}
            onChange={(e) => setSelectedView(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="day">Day View</option>
            <option value="week">Week View</option>
            <option value="month">Month View</option>
          </select>

          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">All Classes</option>
            <option value="10A">Class 10A</option>
            <option value="10B">Class 10B</option>
          </select>

          <button
            onClick={() => setShowConflicts(!showConflicts)}
            className={`inline-flex items-center px-3 py-2 border rounded-lg ${
              showConflicts
                ? "bg-red-50 text-red-600 border-red-200"
                : "border-gray-300"
            }`}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Show Conflicts
          </button>
        </div>

        <button
          onClick={handleAddClass}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Class
        </button>
      </div>

      {/* Schedule Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Class Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="w-20 p-3 border bg-gray-50"></th>
                  {weekDays.map((day) => (
                    <th
                      key={day}
                      className="p-3 border bg-gray-50 font-medium text-gray-700"
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((time) => (
                  <tr key={time}>
                    <td className="p-3 border bg-gray-50 text-sm font-medium text-gray-700">
                      {time}
                    </td>
                    {weekDays.map((day) => {
                      const classItem = filteredClasses.find(
                        (c) => c.day === day && c.startTime === time
                      );

                      return (
                        <td
                          key={`${day}-${time}`}
                          className="border p-1 relative min-h-[100px]"
                        >
                          {classItem && (
                            <div
                              className={`p-2 rounded-lg text-sm ${getColorClass(classItem.color)} hover:shadow-md transition-shadow`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium">
                                  {classItem.subject}
                                </span>
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() =>
                                      handleEditClass(classItem.id)
                                    }
                                    className="p-1 hover:bg-white rounded transition-colors"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteClass(classItem.id)
                                    }
                                    className="p-1 hover:bg-white rounded text-red-500 transition-colors"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                              <div className="mt-1 text-xs text-gray-600">
                                <div className="flex items-center space-x-2">
                                  <Users className="h-3 w-3" />
                                  <span>{classItem.class}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <MapPin className="h-3 w-3" />
                                  <span>{classItem.room}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Room Availability and Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Room Availability Card */}
        <Card>
          <CardHeader>
            <CardTitle>Room Availability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{room.name}</h3>
                    <span className="text-sm text-gray-500">
                      Capacity: {room.capacity}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {room.features.map((feature) => (
                      <span
                        key={feature}
                        className="px-2 py-1 bg-gray-100 rounded-full text-xs"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 grid grid-cols-5 gap-1">
                    {weekDays.map((day) => (
                      <div
                        key={day}
                        className={`h-2 rounded-full ${
                          room.availability[day] ? "bg-green-500" : "bg-red-500"
                        }`}
                        title={`${day}: ${room.availability[day] ? "Available" : "Occupied"}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <button
                className="w-full flex items-center justify-between p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors"
                onClick={handleCopySchedule}
              >
                <div className="flex items-center space-x-3">
                  <Copy className="h-5 w-5 text-blue-600" />
                  <span>Copy Schedule</span>
                </div>
              </button>
              <button
                className="w-full flex items-center justify-between p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors"
                onClick={handleAddClass}
              >
                <div className="flex items-center space-x-3">
                  <Plus className="h-5 w-5 text-green-600" />
                  <span>Add Class</span>
                </div>
              </button>
              <button
                className="w-full flex items-center justify-between p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors"
                onClick={handleExportSchedule}
              >
                <div className="flex items-center space-x-3">
                  <Download className="h-5 w-5 text-purple-600" />
                  <span>Export Schedule</span>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Card */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Classes</span>
                <span className="font-medium">{classes.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Room Utilization</span>
                <span className="font-medium">
                  {Math.round(
                    (classes.length /
                      (rooms.length * weekDays.length * timeSlots.length)) *
                      100
                  )}
                  %
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Conflicts</span>
                <span
                  className={`font-medium ${showConflicts ? "text-red-600" : "text-gray-900"}`}
                >
                  {showConflicts
                    ? classes.filter(
                        (c) => checkConflicts(c, classes).length > 0
                      ).length
                    : 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Free Periods</span>
                <span className="font-medium">
                  {rooms.length * weekDays.length * timeSlots.length -
                    classes.length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Class Modal */}
      <ClassModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingClass(null);
        }}
        classData={editingClass}
        onSave={handleSaveClass}
        timeSlots={timeSlots}
        weekDays={weekDays}
        rooms={rooms}
      />
    </div>
  );
};

export default ClassScheduling;
