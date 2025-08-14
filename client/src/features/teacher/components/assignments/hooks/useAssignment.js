// client/src/features/teacher/components/assignments/hooks/useAssignment.js
import { useState, useCallback, useEffect } from "react";
import { ASSIGNMENT_STATUS } from "../utils/assignmentTypes.js";

/** @typedef {{ id: string, status: string, attachments?: Array<{ id: string }> }} Assignment */
/** @typedef {{ class: string, subject: string, status: string, timeframe: string }} AssignmentFilters */

/** @type {(err: unknown) => string} */
const getErrorMessage = (err) =>
  err instanceof Error ? err.message : "An error occurred";

/** @param {string|null} [assignmentId] */
export const useAssignment = (assignmentId = null) => {
  const [assignment, setAssignment] = useState(
    /** @type {Assignment|null} */ (null)
  );
  const [assignments, setAssignments] = useState(
    /** @type {Assignment[]} */ ([])
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(/** @type {string|null} */ (null));
  const [filters, setFilters] = useState(
    /** @type {AssignmentFilters} */ ({
      class: "all",
      subject: "all",
      status: "all",
      timeframe: "current",
    })
  );

  const handleError = (err) => {
    setError(getErrorMessage(err));
    throw err;
  };

  /** @param {Assignment} updatedAssignment */
  const updateAssignmentsList = (updatedAssignment) => {
    setAssignments((prev) =>
      prev.map((item) =>
        item?.id === updatedAssignment.id ? updatedAssignment : item
      )
    );
  };

  /** @param {string} id */
  const fetchAssignment = useCallback(async (id) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/assignments/${id}`);
      if (!response.ok) throw new Error("Failed to fetch assignment");
      /** @type {Assignment} */
      const data = await response.json();
      setAssignment(data);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  /** @param {Partial<AssignmentFilters>} [customFilters] */
  const fetchAssignments = useCallback(
    async (customFilters = {}) => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          ...filters,
          ...customFilters,
        }).toString();

        const response = await fetch(`/api/assignments?${queryParams}`);
        if (!response.ok) throw new Error("Failed to fetch assignments");

        /** @type {Assignment[]} */
        const data = await response.json();
        setAssignments(data);
        return data;
      } catch (err) {
        handleError(err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  /**
   * @param {Omit<Assignment, 'id'>} assignmentData
   * @returns {Promise<Assignment|null>}
   */
  const createAssignment = async (assignmentData) => {
    setLoading(true);
    try {
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assignmentData),
      });

      if (!response.ok) throw new Error("Failed to create assignment");

      /** @type {Assignment} */
      const newAssignment = await response.json();
      setAssignments((prev) => [...prev, newAssignment]);
      return newAssignment;
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * @param {string} id
   * @param {Partial<Assignment>} updateData
   */
  const updateAssignment = async (id, updateData) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/assignments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) throw new Error("Failed to update assignment");

      /** @type {Assignment} */
      const updatedAssignment = await response.json();
      updateAssignmentsList(updatedAssignment);
      if (assignment?.id === id) {
        setAssignment(updatedAssignment);
      }
      return updatedAssignment;
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /** @param {string} id */
  const deleteAssignment = async (id) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/assignments/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete assignment");

      setAssignments((prev) => prev.filter((a) => a?.id !== id));
      if (assignment?.id === id) {
        setAssignment(null);
      }
      return true;
    } catch (err) {
      handleError(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /** @param {string} id */
  const duplicateAssignment = async (id) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/assignments/${id}/duplicate`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to duplicate assignment");

      /** @type {Assignment} */
      const duplicatedAssignment = await response.json();
      setAssignments((prev) => [...prev, duplicatedAssignment]);
      return duplicatedAssignment;
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * @param {string} id
   * @param {string} newStatus
   */
  const updateStatus = async (id, newStatus) => {
    return updateAssignment(id, { status: newStatus });
  };

  /** @param {string} id */
  const publishAssignment = async (id) => {
    return updateStatus(id, ASSIGNMENT_STATUS.ACTIVE);
  };

  /** @param {string} id */
  const archiveAssignment = async (id) => {
    return updateStatus(id, ASSIGNMENT_STATUS.ARCHIVED);
  };

  /** @param {Partial<AssignmentFilters>} newFilters */
  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  /** @param {string} id */
  const getSubmissions = async (id) => {
    try {
      const response = await fetch(`/api/assignments/${id}/submissions`);
      if (!response.ok) throw new Error("Failed to fetch submissions");
      return await response.json();
    } catch (err) {
      handleError(err);
      return [];
    }
  };

  /**
   * @param {string[]} ids
   * @param {string} newStatus
   */
  const bulkUpdateStatus = async (ids, newStatus) => {
    setLoading(true);
    try {
      const response = await fetch("/api/assignments/bulk-update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update assignments");
      await fetchAssignments(filters);
      return true;
    } catch (err) {
      handleError(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * @param {string} id
   * @param {File} file
   */
  const uploadAttachment = async (id, file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`/api/assignments/${id}/attachments`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to upload attachment");

      /** @type {Assignment} */
      const updatedAssignment = await response.json();
      if (assignment?.id === id) {
        setAssignment(updatedAssignment);
      }
      return updatedAssignment;
    } catch (err) {
      handleError(err);
      return null;
    }
  };

  /**
   * @param {string} assignmentId
   * @param {string} attachmentId
   */
  const removeAttachment = async (assignmentId, attachmentId) => {
    try {
      const response = await fetch(
        `/api/assignments/${assignmentId}/attachments/${attachmentId}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to remove attachment");

      /** @type {Assignment} */
      const updatedAssignment = await response.json();
      if (assignment?.id === assignmentId) {
        setAssignment(updatedAssignment);
      }
      return updatedAssignment;
    } catch (err) {
      handleError(err);
      return null;
    }
  };

  useEffect(() => {
    if (assignmentId) fetchAssignment(assignmentId);
  }, [assignmentId, fetchAssignment]);

  return {
    assignment,
    assignments,
    loading,
    error,
    filters,
    fetchAssignment,
    fetchAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    duplicateAssignment,
    updateStatus,
    publishAssignment,
    archiveAssignment,
    updateFilters,
    getSubmissions,
    bulkUpdateStatus,
    uploadAttachment,
    removeAttachment,
    clearError: () => setError(null),
  };
};

export default useAssignment;
