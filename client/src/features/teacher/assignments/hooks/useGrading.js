// @ts-nocheck

// client/src/features/teacher/components/assignments/hooks/useGrading.js
import { useState, useCallback, useEffect } from "react";

export const useGrading = (assignmentId = null) => {
  const [submissions, setSubmissions] = useState([]);
  const [currentSubmission, setCurrentSubmission] = useState(null);
  const [rubricScores, setRubricScores] = useState({});
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [gradingHistory, setGradingHistory] = useState([]);
  const [filters, setFilters] = useState({
    status: "all",
    graded: "all",
  });

  // Fetch submissions for an assignment
  const fetchSubmissions = useCallback(
    async (customFilters = {}) => {
      if (!assignmentId) return;

      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          ...filters,
          ...customFilters,
        }).toString();

        const response = await fetch(
          `/api/assignments/${assignmentId}/submissions?${queryParams}`
        );

        if (!response.ok) throw new Error("Failed to fetch submissions");

        const data = await response.json();
        setSubmissions(data);
        return data;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [assignmentId, filters]
  );

  // Grade a single submission
  const gradeSubmission = async (submissionId, gradeData) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/submissions/${submissionId}/grade`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...gradeData,
          rubricScores,
          feedback,
        }),
      });

      if (!response.ok) throw new Error("Failed to grade submission");

      const updatedSubmission = await response.json();

      // Update submissions list
      setSubmissions((prev) =>
        prev.map((sub) => (sub.id === submissionId ? updatedSubmission : sub))
      );

      // Add to grading history
      setGradingHistory((prev) => [
        ...prev,
        {
          submissionId,
          timestamp: new Date().toISOString(),
          grade: gradeData.grade,
        },
      ]);

      return updatedSubmission;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update rubric scores
  const updateRubricScore = (criterionId, score) => {
    setRubricScores((prev) => ({
      ...prev,
      [criterionId]: score,
    }));
  };

  // Calculate total score from rubric
  const calculateTotalScore = useCallback(() => {
    if (!Object.keys(rubricScores).length) return 0;

    return Object.values(rubricScores).reduce((sum, score) => sum + score, 0);
  }, [rubricScores]);

  // Batch grade multiple submissions
  const batchGrade = async (submissionIds, gradeData) => {
    setLoading(true);
    try {
      const response = await fetch("/api/submissions/batch-grade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submissionIds,
          ...gradeData,
        }),
      });

      if (!response.ok) throw new Error("Failed to batch grade submissions");

      const updatedSubmissions = await response.json();
      setSubmissions((prev) => {
        const updated = new Map(updatedSubmissions.map((sub) => [sub.id, sub]));
        return prev.map((sub) => updated.get(sub.id) || sub);
      });

      return updatedSubmissions;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Provide feedback
  const provideFeedback = async (submissionId, feedbackText) => {
    try {
      const response = await fetch(
        `/api/submissions/${submissionId}/feedback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ feedback: feedbackText }),
        }
      );

      if (!response.ok) throw new Error("Failed to provide feedback");

      const updatedSubmission = await response.json();

      // Update submissions list
      setSubmissions((prev) =>
        prev.map((sub) => (sub.id === submissionId ? updatedSubmission : sub))
      );

      return updatedSubmission;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Calculate grade statistics
  const calculateGradeStats = useCallback(() => {
    const grades = submissions
      .filter((sub) => sub.grade !== null)
      .map((sub) => sub.grade);

    if (!grades.length) return null;

    const sum = grades.reduce((acc, grade) => acc + grade, 0);
    const avg = sum / grades.length;
    const sorted = [...grades].sort((a, b) => a - b);
    const median =
      grades.length % 2 === 0
        ? (sorted[grades.length / 2 - 1] + sorted[grades.length / 2]) / 2
        : sorted[Math.floor(grades.length / 2)];

    return {
      average: avg,
      median: median,
      highest: Math.max(...grades),
      lowest: Math.min(...grades),
      totalGraded: grades.length,
      pendingGrading: submissions.length - grades.length,
    };
  }, [submissions]);

  // Export grades
  const exportGrades = async (format = "csv") => {
    try {
      const response = await fetch(
        `/api/assignments/${assignmentId}/grades/export?format=${format}`
      );

      if (!response.ok) throw new Error("Failed to export grades");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `grades-${assignmentId}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Load initial data if assignmentId is provided
  useEffect(() => {
    if (assignmentId) {
      fetchSubmissions();
    }
  }, [assignmentId, fetchSubmissions]);

  return {
    // State
    submissions,
    currentSubmission,
    rubricScores,
    feedback,
    loading,
    error,
    gradingHistory,
    filters,

    // Actions
    setCurrentSubmission,
    updateRubricScore,
    setFeedback,
    setFilters,

    // Main functions
    fetchSubmissions,
    gradeSubmission,
    batchGrade,
    provideFeedback,
    exportGrades,

    // Calculations
    calculateTotalScore,
    calculateGradeStats,

    // Utility functions
    clearError: () => setError(null),
    clearGradingHistory: () => setGradingHistory([]),
    resetGrading: () => {
      setRubricScores({});
      setFeedback("");
      setCurrentSubmission(null);
    },
  };
};

export default useGrading;
