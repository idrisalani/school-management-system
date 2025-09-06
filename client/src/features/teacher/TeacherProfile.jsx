// @ts-nocheck
// client/src/features/teacher/TeacherProfile.jsx
import React, { useState, useEffect } from "react";
import { Edit, Camera, Save, X, Download, GraduationCap } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";

const TeacherProfile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [profileData, setProfileData] = useState({
    name: "",
    teacherId: "",
    email: "",
    phone: "",
    address: "",
    department: "",
    subjects: [],
    qualifications: "",
    experience: "",
    emergencyContact: "",
    joinDate: "",
    // Settings
    notifications: {
      assignments: true,
      grades: true,
      attendance: false,
      announcements: true,
    },
    classPreferences: {
      autoGrade: false,
      lateSubmissions: true,
      emailParents: true,
    },
  });

  // Load user data on component mount
  useEffect(() => {
    if (user) {
      setProfileData((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
        teacherId: user.teacherId || "TCH" + user.id,
        department: user.department || "",
        subjects: user.subjects || [],
      }));
    }
  }, [user]);

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      // await updateTeacherProfile(user.id, profileData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setIsEditing(false);
      setSuccessMessage("Profile updated successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError("Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNotificationChange = (type) => {
    setProfileData((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: !prev.notifications[type],
      },
    }));
  };

  const handleClassPreferenceChange = (type) => {
    setProfileData((prev) => ({
      ...prev,
      classPreferences: {
        ...prev.classPreferences,
        [type]: !prev.classPreferences[type],
      },
    }));
  };

  const handleSubjectChange = (index, value) => {
    const newSubjects = [...profileData.subjects];
    newSubjects[index] = value;
    setProfileData((prev) => ({
      ...prev,
      subjects: newSubjects,
    }));
  };

  const addSubject = () => {
    setProfileData((prev) => ({
      ...prev,
      subjects: [...prev.subjects, ""],
    }));
  };

  const removeSubject = (index) => {
    const newSubjects = profileData.subjects.filter((_, i) => i !== index);
    setProfileData((prev) => ({
      ...prev,
      subjects: newSubjects,
    }));
  };

  const handleExport = () => {
    // Create and download profile data as JSON
    const dataStr = JSON.stringify(profileData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `teacher-profile-${profileData.teacherId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-2xl font-bold">
                {profileData.name ? (
                  profileData.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                ) : (
                  <GraduationCap size={32} />
                )}
              </div>
              {isEditing && (
                <button className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full border border-gray-200 text-gray-600 hover:text-gray-900">
                  <Camera size={16} />
                </button>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold text-gray-900">
                {profileData.name || "Teacher Profile"}
              </h2>
              <p className="text-gray-500">
                Teacher ID: {profileData.teacherId || "Not assigned"}
              </p>
              <div className="mt-2 flex flex-wrap justify-center md:justify-start gap-2">
                {profileData.department && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {profileData.department}
                  </span>
                )}
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {profileData.subjects.length} Subjects
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    <Save size={16} className="mr-2" />
                    {isLoading ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <X size={16} className="mr-2" />
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <Edit size={16} className="mr-2" />
                    Edit Profile
                  </button>
                  <button
                    onClick={handleExport}
                    className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <Download size={16} className="mr-2" />
                    Export Data
                  </button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={profileData.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <textarea
                  name="address"
                  value={profileData.address}
                  onChange={handleChange}
                  disabled={!isEditing}
                  rows={3}
                  className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 disabled:bg-gray-50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Professional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Department
                </label>
                <select
                  name="department"
                  value={profileData.department}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 disabled:bg-gray-50"
                >
                  <option value="">Select Department</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Science">Science</option>
                  <option value="English">English</option>
                  <option value="History">History</option>
                  <option value="Physical Education">Physical Education</option>
                  <option value="Art">Art</option>
                  <option value="Music">Music</option>
                  <option value="Computer Science">Computer Science</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subjects Teaching
                </label>
                <div className="space-y-2">
                  {profileData.subjects.map((subject, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) =>
                          handleSubjectChange(index, e.target.value)
                        }
                        disabled={!isEditing}
                        placeholder={`Subject ${index + 1}`}
                        className="flex-1 rounded-lg border border-gray-300 py-2 px-3 disabled:bg-gray-50"
                      />
                      {isEditing && (
                        <button
                          onClick={() => removeSubject(index)}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  {isEditing && (
                    <button
                      onClick={addSubject}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      + Add Subject
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Years of Experience
                </label>
                <input
                  type="number"
                  name="experience"
                  value={profileData.experience}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Join Date
                </label>
                <input
                  type="date"
                  name="joinDate"
                  value={profileData.joinDate}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 disabled:bg-gray-50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Qualifications & Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Qualifications & Emergency Contact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Qualifications
                </label>
                <textarea
                  name="qualifications"
                  value={profileData.qualifications}
                  onChange={handleChange}
                  disabled={!isEditing}
                  rows={4}
                  placeholder="List your degrees, certifications, and qualifications..."
                  className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Emergency Contact
                </label>
                <textarea
                  name="emergencyContact"
                  value={profileData.emergencyContact}
                  onChange={handleChange}
                  disabled={!isEditing}
                  rows={2}
                  placeholder="Name and phone number"
                  className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 disabled:bg-gray-50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings & Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Teaching Preferences & Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Notification Preferences */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Email Notifications
                </label>
                <div className="space-y-3">
                  {Object.entries(profileData.notifications).map(
                    ([key, value]) => (
                      <label key={key} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={() => handleNotificationChange(key)}
                          disabled={!isEditing}
                          className="rounded border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-600 capitalize">
                          {key} updates
                        </span>
                      </label>
                    )
                  )}
                </div>
              </div>

              {/* Class Preferences */}
              <div className="pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Class Management Preferences
                </label>
                <div className="space-y-3">
                  {Object.entries(profileData.classPreferences).map(
                    ([key, value]) => (
                      <label key={key} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={() => handleClassPreferenceChange(key)}
                          disabled={!isEditing}
                          className="rounded border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-600">
                          {key === "autoGrade" &&
                            "Auto-grade multiple choice questions"}
                          {key === "lateSubmissions" &&
                            "Accept late submissions"}
                          {key === "emailParents" &&
                            "Email parents about grades"}
                        </span>
                      </label>
                    )
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherProfile;
