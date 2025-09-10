// @ts-nocheck

//teacher/components/assignments/List/AssignmentFilters.jsx
import React, { useState } from "react";
import { Filter, X, ChevronDown, Search, RefreshCw } from "lucide-react";

const AssignmentFilters = ({
  onFilterChange,
  initialFilters = {},
  showActiveFilters = true,
}) => {
  const [filters, setFilters] = useState({
    search: "",
    class: "all",
    subject: "all",
    status: "all",
    dateRange: "all",
    type: "all",
    tags: [],
    ...initialFilters,
  });

  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [customDateRange, setCustomDateRange] = useState({
    start: null,
    end: null,
  });

  // Filter options
  const classes = [
    { id: "all", name: "All Classes" },
    { id: "10A", name: "Class 10A" },
    { id: "10B", name: "Class 10B" },
    { id: "11A", name: "Class 11A" },
  ];

  const subjects = [
    { id: "all", name: "All Subjects" },
    { id: "math", name: "Mathematics" },
    { id: "science", name: "Science" },
    { id: "english", name: "English" },
  ];

  const statuses = [
    { id: "all", name: "All Status" },
    { id: "active", name: "Active" },
    { id: "draft", name: "Draft" },
    { id: "archived", name: "Archived" },
  ];

  const dateRanges = [
    { id: "all", name: "All Time" },
    { id: "today", name: "Today" },
    { id: "week", name: "This Week" },
    { id: "month", name: "This Month" },
    { id: "custom", name: "Custom Range" },
  ];

  const types = [
    { id: "all", name: "All Types" },
    { id: "homework", name: "Homework" },
    { id: "quiz", name: "Quiz" },
    { id: "test", name: "Test" },
    { id: "project", name: "Project" },
  ];

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleCustomDateChange = (key, value) => {
    const newDateRange = { ...customDateRange, [key]: value };
    setCustomDateRange(newDateRange);

    if (newDateRange.start && newDateRange.end) {
      handleFilterChange("dateRange", "custom");
      handleFilterChange("customDates", newDateRange);
    }
  };

  const handleTagAdd = (tag) => {
    if (!filters.tags.includes(tag)) {
      handleFilterChange("tags", [...filters.tags, tag]);
    }
  };

  const handleTagRemove = (tagToRemove) => {
    handleFilterChange(
      "tags",
      filters.tags.filter((tag) => tag !== tagToRemove)
    );
  };

  const clearFilters = () => {
    const resetFilters = {
      search: "",
      class: "all",
      subject: "all",
      status: "all",
      dateRange: "all",
      type: "all",
      tags: [],
    };
    setFilters(resetFilters);
    setCustomDateRange({ start: null, end: null });
    onFilterChange(resetFilters);
  };

  return (
    <div className="space-y-4">
      {/* Search and Main Filters Row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search Input */}
        <div className="relative flex-grow max-w-md">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            placeholder="Search assignments..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Quick Filters */}
        <div className="flex items-center gap-2">
          <select
            value={filters.class}
            onChange={(e) => handleFilterChange("class", e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {classes.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>

          <select
            value={filters.subject}
            onChange={(e) => handleFilterChange("subject", e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {subjects.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter size={20} className="mr-2" />
            More Filters
            <ChevronDown size={16} className="ml-2" />
          </button>

          {showActiveFilters && hasActiveFilters(filters) && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <RefreshCw size={16} className="mr-2" />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilterMenu && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                {statuses.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) =>
                  handleFilterChange("dateRange", e.target.value)
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                {dateRanges.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Assignment Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange("type", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                {types.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom Date Range */}
          {filters.dateRange === "custom" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={customDateRange.start || ""}
                  onChange={(e) =>
                    handleCustomDateChange("start", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={customDateRange.end || ""}
                  onChange={(e) =>
                    handleCustomDateChange("end", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
          )}

          {/* Tags Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {filters.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-blue-100 text-blue-700"
                >
                  {tag}
                  <button
                    onClick={() => handleTagRemove(tag)}
                    className="ml-1 hover:text-blue-900"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
              <input
                type="text"
                placeholder="Add tag..."
                onKeyPress={(e) => {
                  if (e.key === "Enter" && e.target.value) {
                    handleTagAdd(e.target.value);
                    e.target.value = "";
                  }
                }}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to check if there are active filters
const hasActiveFilters = (filters) => {
  return (
    filters.search ||
    filters.class !== "all" ||
    filters.subject !== "all" ||
    filters.status !== "all" ||
    filters.dateRange !== "all" ||
    filters.type !== "all" ||
    filters.tags.length > 0
  );
};

export default AssignmentFilters;
