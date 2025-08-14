// @ts-nocheck

// src/features/teacher/components/ClassModal.jsx
import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

/**
 * @typedef {'blue' | 'green' | 'purple' | 'orange'} ColorType
 */

/**
 * @typedef {object} ClassData
 * @property {number} [id] - Unique identifier for the class
 * @property {string} subject - Subject name or title
 * @property {string} class - Class name or section
 * @property {string} teacher - Assigned teacher name
 * @property {string} room - Room number or location
 * @property {string} day - Day of the week
 * @property {string} startTime - Class start time
 * @property {number} duration - Class duration in minutes
 * @property {ColorType} color - Color theme for the class
 */

/**
 * @typedef {object} ClassModalProps
 * @property {boolean} isOpen - Whether the modal is open
 * @property {() => void} onClose - Function to close the modal
 * @property {ClassData | null} classData - Existing class data for editing
 * @property {(data: ClassData) => void} onSave - Function to save class data
 */

/**
 * Default form values for a new class
 * @type {ClassData}
 */
const defaultFormData = {
  subject: "",
  class: "",
  teacher: "",
  room: "",
  day: "Monday",
  startTime: "8:00 AM",
  duration: 60,
  color: "blue",
};

/**
 * @type {Record<string, (value: any) => string | null>}
 */
const validationRules = {
  subject: (value) => (!value ? "Subject is required" : null),
  class: (value) => (!value ? "Class is required" : null),
  teacher: (value) => (!value ? "Teacher is required" : null),
  room: (value) => (!value ? "Room is required" : null),
};

/**
 * ClassModal Component
 * @param {ClassModalProps} props - Component props containing modal state and handlers
 * @returns {React.ReactElement | null} Modal component or null if not open
 */
const ClassModal = ({ isOpen, onClose, classData, onSave }) => {
  /** @type {[ClassData, React.Dispatch<React.SetStateAction<ClassData>>]} */
  const [formData, setFormData] = useState(defaultFormData);

  /** @type {[Record<string, string>, React.Dispatch<React.SetStateAction<Record<string, string>>>]} */
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (classData) {
      setFormData(classData);
    } else {
      setFormData(defaultFormData);
    }
    setErrors({});
  }, [classData, isOpen]);

  /**
   * Validates the form data
   * @returns {boolean} True if form is valid, false otherwise
   */
  const validateForm = () => {
    const newErrors = {};
    Object.entries(validationRules).forEach(([field, validateFn]) => {
      const error = validateFn(formData[field]);
      if (error) {
        newErrors[field] = error;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handles form input changes
   * @param {string} field - The form field being updated
   * @param {string | number} value - The new value for the field
   */
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when field is edited
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  /**
   * Handles form submission
   * @param {React.FormEvent} e - Form submission event
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {classData ? "Edit Class" : "Add New Class"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Subject */}
          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => handleInputChange("subject", e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${
                errors.subject ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.subject && (
              <p className="text-red-500 text-xs mt-1">{errors.subject}</p>
            )}
          </div>

          {/* Class */}
          <div>
            <label className="block text-sm font-medium mb-1">Class</label>
            <select
              value={formData.class}
              onChange={(e) => handleInputChange("class", e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${
                errors.class ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Select Class</option>
              <option value="10A">Class 10A</option>
              <option value="10B">Class 10B</option>
              <option value="11A">Class 11A</option>
              <option value="11B">Class 11B</option>
            </select>
            {errors.class && (
              <p className="text-red-500 text-xs mt-1">{errors.class}</p>
            )}
          </div>

          {/* Teacher */}
          <div>
            <label className="block text-sm font-medium mb-1">Teacher</label>
            <select
              value={formData.teacher}
              onChange={(e) => handleInputChange("teacher", e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${
                errors.teacher ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Select Teacher</option>
              <option value="Mr. Johnson">Mr. Johnson</option>
              <option value="Mrs. Smith">Mrs. Smith</option>
              <option value="Dr. Wilson">Dr. Wilson</option>
            </select>
            {errors.teacher && (
              <p className="text-red-500 text-xs mt-1">{errors.teacher}</p>
            )}
          </div>

          {/* Room */}
          <div>
            <label className="block text-sm font-medium mb-1">Room</label>
            <select
              value={formData.room}
              onChange={(e) => handleInputChange("room", e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${
                errors.room ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Select Room</option>
              <option value="201">Room 201</option>
              <option value="301">Room 301</option>
              <option value="302">Room 302</option>
            </select>
            {errors.room && (
              <p className="text-red-500 text-xs mt-1">{errors.room}</p>
            )}
          </div>

          {/* Day */}
          <div>
            <label className="block text-sm font-medium mb-1">Day</label>
            <select
              value={formData.day}
              onChange={(e) => handleInputChange("day", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
            </select>
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium mb-1">Start Time</label>
            <select
              value={formData.startTime}
              onChange={(e) => handleInputChange("startTime", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="8:00 AM">8:00 AM</option>
              <option value="9:00 AM">9:00 AM</option>
              <option value="10:00 AM">10:00 AM</option>
              <option value="11:00 AM">11:00 AM</option>
              <option value="12:00 PM">12:00 PM</option>
              <option value="1:00 PM">1:00 PM</option>
              <option value="2:00 PM">2:00 PM</option>
              <option value="3:00 PM">3:00 PM</option>
            </select>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium mb-1">Color</label>
            <div className="flex gap-2">
              {["blue", "green", "purple", "orange"].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleInputChange("color", color)}
                  className={`w-8 h-8 rounded-full ${
                    formData.color === color
                      ? "ring-2 ring-offset-2 ring-blue-500"
                      : ""
                  } bg-${color}-500`}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {classData ? "Update" : "Add"} Class
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClassModal;
