// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Calendar, Users, CheckCircle } from "lucide-react";
import { useAssignment } from "../hooks/useAssignment";
import AssignmentFilters from "./AssignmentFilters";
import AssignmentBulkActions from "./AssignmentBulkActions";
import { Card } from "../../../../../components/ui/card";
import PropTypes from "prop-types";
import { toFullAssignment, toBulkActionAssignment } from "../types";

/**
 * @typedef {object} AssignmentSubmissions
 * @property {number} submitted - Number of submitted assignments
 * @property {number} total - Total number of expected submissions
 */

/**
 * @typedef {object} BulkActionAssignment
 * @property {string|number} id - Assignment ID
 * @property {string} title - Assignment title
 * @property {string} status - Assignment status
 */

/**
 * @typedef {object} AssignmentBulkActionsProps
 * @property {BulkActionAssignment[]} selectedAssignments - Currently selected assignments
 * @property {(assignments: BulkActionAssignment[]) => void} onSelectionChange - Callback when selection changes
 * @property {() => void} onActionComplete - Callback when bulk action completes
 */

/**
 * @typedef {object} Assignment
 * @property {string|number} id - Assignment ID
 * @property {string} title - Assignment title
 * @property {string} subject - Assignment subject
 * @property {string} class - Class name
 * @property {string} dueDate - Due date
 * @property {string} status - Assignment status
 * @property {AssignmentSubmissions} [submissions] - Submission statistics
 */

const AssignmentList = () => {
  const navigate = useNavigate();
  const [selectedAssignments, setSelectedAssignments] = useState(
    /** @type {Assignment[]} */ ([])
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({
    key: "dueDate",
    direction: "asc",
  });

  const { assignments, loading, error, fetchAssignments, updateFilters } =
    useAssignment();

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleFilterChange = (newFilters) => {
    updateFilters(newFilters);
    setCurrentPage(1);
    setSelectedAssignments([]);
  };

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction:
        sortConfig.key === key && sortConfig.direction === "asc"
          ? "desc"
          : "asc",
    });
  };

  const handleSelectAll = (checked) => {
    setSelectedAssignments(checked ? assignments : []);
  };

  const handleSelectAssignment = (assignment, checked) => {
    setSelectedAssignments((prev) =>
      checked
        ? [...prev, assignment]
        : prev.filter((a) => a.id !== assignment.id)
    );
  };

  const handleBulkActionComplete = () => {
    setSelectedAssignments([]);
    fetchAssignments();
  };

  const handleCreateAssignment = () => {
    navigate("/assignments/create");
  };

  const handleViewAssignment = (assignmentId) => {
    navigate(`/assignments/${assignmentId}`);
  };

  const getStatusColor = (status) => {
    const colors = {
      active: "bg-green-100 text-green-800",
      draft: "bg-gray-100 text-gray-800",
      archived: "bg-yellow-100 text-yellow-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  // Sort assignments
  const sortedAssignments = [...assignments].sort((a, b) => {
    const direction = sortConfig.direction === "asc" ? 1 : -1;
    if (a[sortConfig.key] < b[sortConfig.key]) return -1 * direction;
    if (a[sortConfig.key] > b[sortConfig.key]) return 1 * direction;
    return 0;
  });

  // Paginate assignments
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAssignments = sortedAssignments.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(assignments.length / itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Assignments</h2>
        <button
          onClick={handleCreateAssignment}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} className="mr-2" />
          Create Assignment
        </button>
      </div>

      {/* Filters */}
      <AssignmentFilters onFilterChange={handleFilterChange} />

      {/* Bulk Actions */}
      {selectedAssignments.length > 0 && (
        <AssignmentBulkActions
          selectedAssignments={selectedAssignments.map(toBulkActionAssignment)}
          onSelectionChange={(newAssignments) => {
            // Convert bulk action assignments back to full assignments
            const fullAssignments = newAssignments.map((assignment) => {
              const existingAssignment = selectedAssignments.find(
                (a) => a.id === assignment.id
              );
              return existingAssignment ?? toFullAssignment(assignment);
            });
            setSelectedAssignments(fullAssignments);
          }}
          onActionComplete={handleBulkActionComplete}
        />
      )}

      {/* Assignments List */}
      <Card>
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading assignments...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">
            <p>{error}</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No assignments found</p>
            <button
              onClick={handleCreateAssignment}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              Create your first assignment
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedAssignments.length === assignments.length
                      }
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600"
                    />
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("title")}
                  >
                    Assignment
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("dueDate")}
                  >
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submissions
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentAssignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedAssignments.some(
                          (a) => a.id === assignment.id
                        )}
                        onChange={(e) =>
                          handleSelectAssignment(assignment, e.target.checked)
                        }
                        className="rounded border-gray-300 text-blue-600"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {assignment.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {assignment.subject}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar size={16} className="mr-2 text-gray-400" />
                        {new Date(assignment.dueDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-900">
                        <Users size={16} className="mr-2 text-gray-400" />
                        {assignment.class}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          assignment.status
                        )}`}
                      >
                        {assignment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-900">
                        <CheckCircle size={16} className="mr-2 text-gray-400" />
                        {assignment.submissions?.submitted ?? 0}/
                        {assignment.submissions?.total ?? 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <button
                        onClick={() => handleViewAssignment(assignment.id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
            <div className="flex items-center">
              <span className="text-sm text-gray-700">
                Showing {indexOfFirstItem + 1} to{" "}
                {Math.min(indexOfLastItem, assignments.length)} of{" "}
                {assignments.length} assignments
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

// PropTypes definitions go here, after the component definition
AssignmentList.propTypes = {
  onFilterChange: PropTypes.func,
  onSelectionChange: PropTypes.func,
  onActionComplete: PropTypes.func.isRequired,
};

// defaultProps definitions go here
AssignmentList.defaultProps = {
  onFilterChange: () => {},
  onSelectionChange: () => {},
};

export default AssignmentList;
