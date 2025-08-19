//@ts-nocheck

// client/src/features/parent/ParentProfile.jsx
import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Edit3,
  Save,
  X,
  Calendar,
  Users,
  BookOpen,
  ArrowLeft,
} from "lucide-react";

const ParentProfile = ({ onBack = null }) => {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    emergencyContact: "",
    relationship: "parent",
  });

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setFormData({
          firstName: parsedUser.firstName || "",
          lastName: parsedUser.lastName || "",
          email: parsedUser.email || "",
          phone: parsedUser.phone || "",
          address: parsedUser.address || "",
          emergencyContact: parsedUser.emergencyContact || "",
          relationship: parsedUser.relationship || "parent",
        });
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
    setLoading(false);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = () => {
    // Update user data in localStorage (in a real app, this would be an API call)
    const updatedUser = { ...user, ...formData };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
    setIsEditing(false);

    // Show success message
    alert("Profile updated successfully!");
  };

  const handleCancel = () => {
    // Reset form data to original user data
    setFormData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
      emergencyContact: user?.emergencyContact || "",
      relationship: user?.relationship || "parent",
    });
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              {onBack && (
                <button
                  onClick={onBack}
                  className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <div className="bg-blue-600 p-2 rounded-lg mr-3">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Parent Profile
                </h1>
                <p className="text-sm text-gray-600">
                  Manage your account information
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Profile
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSave}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
              <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <User className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {formData.firstName} {formData.lastName}
              </h3>
              <p className="text-gray-600 mb-4 capitalize">
                {formData.relationship}
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  {formData.email}
                </div>
                <div className="flex items-center justify-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2" />
                  {formData.phone || "No phone number"}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Stats
              </h4>
              <div className="space-y-4">
                <StatItem icon={Users} label="Children" value="2" />
                <StatItem icon={BookOpen} label="Active Classes" value="8" />
                <StatItem icon={Calendar} label="Upcoming Events" value="3" />
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Personal Information
              </h3>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    required
                  />
                  <FormField
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    required
                  />
                </div>

                <FormField
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  required
                />

                <FormField
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="+1 (555) 123-4567"
                />

                <FormField
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="123 Main St, City, State 12345"
                />

                <FormField
                  label="Emergency Contact"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Name and phone number"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Relationship
                  </label>
                  <select
                    name="relationship"
                    value={formData.relationship}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  >
                    <option value="parent">Parent</option>
                    <option value="guardian">Guardian</option>
                    <option value="grandparent">Grandparent</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </form>
            </div>

            {/* Account Settings */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Account Settings
              </h3>
              <div className="space-y-4">
                <SettingItem
                  title="Email Notifications"
                  description="Receive updates about your children's activities"
                  enabled={true}
                />
                <SettingItem
                  title="SMS Notifications"
                  description="Get text messages for urgent updates"
                  enabled={false}
                />
                <SettingItem
                  title="Weekly Reports"
                  description="Receive weekly progress summaries"
                  enabled={true}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Helper Components
const FormField = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  disabled,
  required,
  placeholder,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
    />
  </div>
);

const StatItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center">
      <Icon className="h-5 w-5 text-blue-600 mr-3" />
      <span className="text-sm text-gray-600">{label}</span>
    </div>
    <span className="text-sm font-semibold text-gray-900">{value}</span>
  </div>
);

const SettingItem = ({ title, description, enabled }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
    <div>
      <h4 className="text-sm font-medium text-gray-900">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
    <div className="flex items-center">
      <div
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? "bg-blue-600" : "bg-gray-200"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </div>
    </div>
  </div>
);

export default ParentProfile;
