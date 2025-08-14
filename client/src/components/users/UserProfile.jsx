// @ts-nocheck

// client/src/components/users/UserProfile.jsx
import React, { useState, useEffect } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Camera,
  Save,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";
import { Alert, AlertDescription } from "../../components/ui/alert";

/**
 * User Profile component displaying and editing user information
 * @param {object} props - Component properties
 * @param {string} props.userId - ID of the user to display
 * @returns {React.ReactElement} UserProfile component
 */
const UserProfile = ({ userId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    role: "",
    department: "",
    joinDate: "",
    subjects: [],
    qualifications: [],
  });

  const [editFormData, setEditFormData] = useState({});

  const [usernameData, setUsernameData] = useState({
    username: "",
    isUpdating: false,
    error: "",
    success: "",
  });

  // Load user data when component mounts or userId changes
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!userId) return;

      setLoading(true);
      try {
        // Simulate API call - replace with actual API endpoint
        const response = await fetch(`/api/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setProfileData(userData);
          setUsernameData((prev) => ({
            ...prev,
            username: userData.username || "user",
          }));
        } else {
          // Fallback to mock data if API fails
          const mockData = {
            name: "John Doe",
            email: "john.doe@school.com",
            phone: "+1 234 567 890",
            address: "123 School Street, City, Country",
            role: "teacher",
            department: "Mathematics",
            joinDate: "2023-09-01",
            subjects: ["Mathematics", "Physics"],
            qualifications: ["M.Sc Mathematics", "B.Ed"],
            username: "johndoe",
          };
          setProfileData(mockData);
          setUsernameData((prev) => ({ ...prev, username: mockData.username }));
        }
      } catch (error) {
        console.error("Failed to load user profile:", error);
        // Use mock data as fallback
        const mockData = {
          name: "John Doe",
          email: "john.doe@school.com",
          phone: "+1 234 567 890",
          address: "123 School Street, City, Country",
          role: "teacher",
          department: "Mathematics",
          joinDate: "2023-09-01",
          subjects: ["Mathematics", "Physics"],
          qualifications: ["M.Sc Mathematics", "B.Ed"],
          username: "johndoe",
        };
        setProfileData(mockData);
        setUsernameData((prev) => ({ ...prev, username: mockData.username }));
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [userId]);

  // Initialize edit form data when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setEditFormData({ ...profileData });
    }
  }, [isEditing, profileData]);

  // Username update handler
  const handleUsernameUpdate = async (newUsername) => {
    setUsernameData((prev) => ({
      ...prev,
      isUpdating: true,
      error: "",
      success: "",
    }));
    try {
      const response = await fetch("/api/users/update-username", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ userId, username: newUsername }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to update username");
      }

      setUsernameData((prev) => ({
        ...prev,
        username: newUsername,
        success: "Username updated successfully",
        error: "",
      }));

      // Update profile data with new username
      setProfileData((prev) => ({ ...prev, username: newUsername }));
    } catch (error) {
      setUsernameData((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "Failed to update username",
        success: "",
      }));
    } finally {
      setUsernameData((prev) => ({ ...prev, isUpdating: false }));
    }
  };

  // Handle form field changes
  const handleFieldChange = (field, value) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle save profile changes
  const handleSave = async () => {
    try {
      // Update username if changed
      if (usernameData.username !== profileData.username) {
        await handleUsernameUpdate(usernameData.username);
      }

      // Update other profile data
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(editFormData),
      });

      if (response.ok) {
        const updatedData = await response.json();
        setProfileData(updatedData);
        setIsEditing(false);
      } else {
        // For demo purposes, just update local state
        setProfileData(editFormData);
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
      // For demo purposes, still update local state
      setProfileData(editFormData);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    // Reset changes
    setEditFormData({ ...profileData });
    setUsernameData((prev) => ({
      ...prev,
      username: profileData.username || "user",
      error: "",
      success: "",
    }));
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-3">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (!profileData.name) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Profile not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold">
                {profileData.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </div>
              <button className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full border border-gray-200 text-gray-600 hover:text-gray-900">
                <Camera size={16} />
              </button>
            </div>

            {/* Basic Info */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold text-gray-900">
                {isEditing ? (
                  <input
                    type="text"
                    value={editFormData.name || ""}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    className="text-2xl font-bold bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none"
                  />
                ) : (
                  profileData.name
                )}
              </h2>
              <p className="text-gray-500">
                {isEditing ? (
                  <input
                    type="email"
                    value={editFormData.email || ""}
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                    className="bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none"
                  />
                ) : (
                  profileData.email
                )}
              </p>
              <div className="mt-2 flex flex-wrap justify-center md:justify-start gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {profileData.role}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {profileData.department}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Save size={16} className="mr-2" />
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <X size={16} className="mr-2" />
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail size={20} className="text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Email</p>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editFormData.email || ""}
                      onChange={(e) =>
                        handleFieldChange("email", e.target.value)
                      }
                      className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.email}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone size={20} className="text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Phone</p>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editFormData.phone || ""}
                      onChange={(e) =>
                        handleFieldChange("phone", e.target.value)
                      }
                      className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.phone}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin size={20} className="text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Address</p>
                  {isEditing ? (
                    <textarea
                      value={editFormData.address || ""}
                      onChange={(e) =>
                        handleFieldChange("address", e.target.value)
                      }
                      rows={2}
                      className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.address}</p>
                  )}
                </div>
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
              {/* Username field */}
              <div>
                <p className="text-sm text-gray-500">Username</p>
                {isEditing ? (
                  <div className="mt-1 space-y-2">
                    <input
                      type="text"
                      value={usernameData.username}
                      onChange={(e) =>
                        setUsernameData((prev) => ({
                          ...prev,
                          username: e.target.value,
                          error: "",
                          success: "",
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={usernameData.isUpdating}
                    />
                    {usernameData.error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {usernameData.error}
                        </AlertDescription>
                      </Alert>
                    )}
                    {usernameData.success && (
                      <Alert variant="success">
                        <AlertDescription>
                          {usernameData.success}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-900">@{usernameData.username}</p>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-500">Department</p>
                {isEditing ? (
                  <input
                    type="text"
                    value={editFormData.department || ""}
                    onChange={(e) =>
                      handleFieldChange("department", e.target.value)
                    }
                    className="w-full px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{profileData.department}</p>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-500">Subjects</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {profileData.subjects.map((subject, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Qualifications</p>
                <ul className="list-disc list-inside text-gray-900 mt-1">
                  {profileData.qualifications.map((qual, index) => (
                    <li key={index}>{qual}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-sm text-gray-500">Join Date</p>
                <p className="text-gray-900">
                  {new Date(profileData.joinDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserProfile;
