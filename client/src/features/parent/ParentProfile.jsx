// @ts-nocheck
// client/src/features/parent/ParentProfile.jsx - Optimized with Auth Integration
import React, { useState, useEffect } from "react";
import { Edit, Camera, Save, X, Download, Heart } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";

const ParentProfile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [profileData, setProfileData] = useState({
    name: "",
    parentId: "",
    email: "",
    phone: "",
    address: "",
    emergencyContact: "",
    relationship: "parent",
    occupation: "",
    workPhone: "",
    // Settings
    notifications: {
      grades: true,
      assignments: true,
      attendance: true,
      events: true,
      emergencies: true,
    },
    communicationPreferences: {
      email: true,
      sms: false,
      pushNotifications: true,
    },
  });

  // Load user data on component mount - FIXED: Using auth instead of localStorage
  useEffect(() => {
    if (user) {
      setProfileData((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
        parentId: user.parentId || "PAR" + user.id,
        phone: user.phone || "",
        address: user.address || "",
        relationship: user.relationship || "parent",
      }));
    }
  }, [user]);

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      // await updateParentProfile(user.id, profileData);

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

  const handleCommunicationChange = (type) => {
    setProfileData((prev) => ({
      ...prev,
      communicationPreferences: {
        ...prev.communicationPreferences,
        [type]: !prev.communicationPreferences[type],
      },
    }));
  };

  const handleExport = () => {
    // Create and download profile data as JSON
    const dataStr = JSON.stringify(profileData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `parent-profile-${profileData.parentId}.json`;
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
              <div className="h-24 w-24 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-2xl font-bold">
                {profileData.name ? (
                  profileData.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                ) : (
                  <Heart size={32} />
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
                {profileData.name || "Parent Profile"}
              </h2>
              <p className="text-gray-500">
                Parent ID: {profileData.parentId || "Not assigned"}
              </p>
              <div className="mt-2 flex flex-wrap justify-center md:justify-start gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">
                  {profileData.relationship}
                </span>
                {profileData.occupation && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {profileData.occupation}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
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
                  Relationship to Student
                </label>
                <select
                  name="relationship"
                  value={profileData.relationship}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 disabled:bg-gray-50"
                >
                  <option value="parent">Parent</option>
                  <option value="guardian">Guardian</option>
                  <option value="grandparent">Grandparent</option>
                  <option value="stepparent">Step-parent</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact & Work Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact & Work Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Home Address
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
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Occupation
                </label>
                <input
                  type="text"
                  name="occupation"
                  value={profileData.occupation}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder="Your profession/job title"
                  className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Work Phone
                </label>
                <input
                  type="tel"
                  name="workPhone"
                  value={profileData.workPhone}
                  onChange={handleChange}
                  disabled={!isEditing}
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
                  placeholder="Name and phone number of alternative contact"
                  className="mt-1 block w-full rounded-lg border border-gray-300 py-2 px-3 disabled:bg-gray-50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
                          {key === "emergencies"
                            ? "Emergency alerts"
                            : `${key} updates`}
                        </span>
                      </label>
                    )
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Communication Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Communication Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Preferred Communication Methods
                </label>
                <div className="space-y-3">
                  {Object.entries(profileData.communicationPreferences).map(
                    ([key, value]) => (
                      <label key={key} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={() => handleCommunicationChange(key)}
                          disabled={!isEditing}
                          className="rounded border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-600">
                          {key === "email" && "Email notifications"}
                          {key === "sms" && "Text message alerts"}
                          {key === "pushNotifications" &&
                            "Mobile app notifications"}
                        </span>
                      </label>
                    )
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Important Notes
                </h4>
                <p className="text-xs text-gray-500">
                  Emergency notifications will always be sent regardless of your
                  preferences. You can change these settings at any time.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ParentProfile;
