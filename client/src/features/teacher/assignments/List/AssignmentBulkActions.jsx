// @ts-nocheck
import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  Trash2,
  Archive,
  Copy,
  Download,
  Mail,
  CheckSquare,
  Square,
  AlertTriangle,
} from "lucide-react";
import { useAssignment } from "../hooks/useAssignment";
import { useNotification } from "../../../../components/ui/notification";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog";

/**
 * @typedef {object} Assignment
 * @property {number|string} id - Assignment ID
 * @property {string} title - Assignment title
 * @property {string} status - Assignment status
 */

/**
 * @typedef {object} AssignmentBulkActionsProps
 * @property {Assignment[]} selectedAssignments - Array of selected assignments
 * @property {(assignments: Assignment[]) => void} onSelectionChange - Callback when selection changes
 * @property {() => void} onActionComplete - Callback when bulk action completes
 */

/**
 * Component for handling bulk actions on assignments
 * @param {AssignmentBulkActionsProps} props - The component props for managing bulk actions on assignments
 * @returns {React.ReactElement} The rendered bulk actions component with action buttons and confirmation dialog
 */
const AssignmentBulkActions = ({
  selectedAssignments,
  onSelectionChange,
  onActionComplete,
}) => {
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [actionType, setActionType] = useState(
    /** @type {string|null} */ (null)
  );

  const { bulkUpdateStatus, deleteAssignment } = useAssignment();
  const { showNotification } = useNotification();

  const handleBulkAction = async (action) => {
    if (["delete", "archive"].includes(action)) {
      setActionType(action);
      setShowConfirmDialog(true);
      return;
    }

    try {
      setLoading(true);
      switch (action) {
        case "duplicate":
          await Promise.all(
            selectedAssignments.map((assignment) =>
              duplicateAssignments(assignment.id)
            )
          );
          showNotification({
            title: "Success",
            message: "Assignments duplicated successfully",
            variant: "success",
          });
          break;

        case "export":
          await exportAssignments(selectedAssignments.map((a) => a.id));
          showNotification({
            title: "Success",
            message: "Assignments exported successfully",
            variant: "success",
          });
          break;

        case "notify":
          await sendNotifications(selectedAssignments.map((a) => a.id));
          showNotification({
            title: "Success",
            message: "Notifications sent successfully",
            variant: "success",
          });
          break;

        default:
          console.warn("Unknown action:", action);
      }
      onActionComplete?.();
    } catch (error) {
      showNotification({
        title: "Error",
        message:
          error instanceof Error ? error.message : "Failed to perform action",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmedAction = async () => {
    try {
      setLoading(true);
      if (actionType === "delete") {
        await Promise.all(
          selectedAssignments.map((assignment) =>
            deleteAssignment(assignment.id)
          )
        );
        showNotification({
          title: "Success",
          message: "Assignments deleted successfully",
          variant: "success",
        });
      } else if (actionType === "archive") {
        await bulkUpdateStatus(
          selectedAssignments.map((a) => a.id),
          "archived"
        );
        showNotification({
          title: "Success",
          message: "Assignments archived successfully",
          variant: "success",
        });
      }
      onActionComplete?.();
    } catch (error) {
      showNotification({
        title: "Error",
        message:
          error instanceof Error
            ? error.message
            : `Failed to ${actionType} assignments`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setShowConfirmDialog(false);
    }
  };

  const duplicateAssignments = async (assignmentId) => {
    // Implement duplicate logic
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log("Duplicating assignment:", assignmentId);
  };

  const exportAssignments = async (assignmentIds) => {
    // Implement export logic
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log("Exporting assignments:", assignmentIds);
  };

  const sendNotifications = async (assignmentIds) => {
    // Implement notification logic
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log("Sending notifications for:", assignmentIds);
  };

  return (
    <>
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onSelectionChange([])}
            className="p-2 hover:bg-gray-100 rounded-lg"
            type="button"
          >
            {selectedAssignments.length > 0 ? (
              <CheckSquare className="text-blue-600" size={20} />
            ) : (
              <Square className="text-gray-400" size={20} />
            )}
          </button>
          <span className="text-sm text-gray-600">
            {selectedAssignments.length} selected
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleBulkAction("duplicate")}
            disabled={loading || selectedAssignments.length === 0}
            className="flex items-center px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            type="button"
          >
            <Copy size={16} className="mr-2" />
            <span className="hidden sm:inline">Duplicate</span>
          </button>

          <button
            onClick={() => handleBulkAction("archive")}
            disabled={loading || selectedAssignments.length === 0}
            className="flex items-center px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            type="button"
          >
            <Archive size={16} className="mr-2" />
            <span className="hidden sm:inline">Archive</span>
          </button>

          <button
            onClick={() => handleBulkAction("notify")}
            disabled={loading || selectedAssignments.length === 0}
            className="flex items-center px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            type="button"
          >
            <Mail size={16} className="mr-2" />
            <span className="hidden sm:inline">Notify</span>
          </button>

          <button
            onClick={() => handleBulkAction("export")}
            disabled={loading || selectedAssignments.length === 0}
            className="flex items-center px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            type="button"
          >
            <Download size={16} className="mr-2" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={() => handleBulkAction("delete")}
            disabled={loading || selectedAssignments.length === 0}
            className="flex items-center px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
            type="button"
          >
            <Trash2 size={16} className="mr-2" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>

      <Dialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
      >
        <DialogContent onClose={() => setShowConfirmDialog(false)}>
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center space-x-2 text-yellow-600">
                <AlertTriangle size={24} />
                <span>Confirm Action</span>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              {actionType === "delete"
                ? "Are you sure you want to delete the selected assignments? This action cannot be undone."
                : "Are you sure you want to archive the selected assignments?"}
            </p>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowConfirmDialog(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              disabled={loading}
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmedAction}
              className={`px-4 py-2 text-white rounded-lg ${
                actionType === "delete"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
              disabled={loading}
              type="button"
            >
              {loading ? "Processing..." : `Confirm ${actionType}`}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

AssignmentBulkActions.propTypes = {
  selectedAssignments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
    })
  ).isRequired,
  onSelectionChange: PropTypes.func.isRequired,
  onActionComplete: PropTypes.func,
};

export default AssignmentBulkActions;
