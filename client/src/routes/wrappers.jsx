// @ts-check
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Import assignment components
import GradingWizard from "../features/teacher/assignments/Workflow/GradingWizard";
import RubricBuilder from "../features/teacher/assignments/shared/RubricBuilder";
import SubmissionCard from "../features/teacher/assignments/shared/SubmissionCard";
import CommentThread from "../features/teacher/assignments/shared/CommentThread";

// Import services
import api from "../services/api";

/**
 * Simple toast notification system
 */
const toast = {
  success: (message) => {
    console.log("SUCCESS:", message);
    // You can replace this with your preferred notification system
    // For now, using console.log as placeholder
  },
  error: (message) => {
    console.error("ERROR:", message);
    // You can replace this with your preferred notification system
  },
};

/**
 * Error component for missing parameters
 * @param {object} props - Component props
 * @param {string} props.message - Error message to display
 * @param {() => void} props.onGoBack - Function to handle going back
 * @returns {React.ReactElement} Error component
 */
function ParameterError({ message, onGoBack }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
        <div className="text-red-600 mb-4">
          <svg
            className="w-12 h-12 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Invalid URL
        </h3>
        <p className="text-gray-600 mb-4">{message}</p>
        <button
          onClick={onGoBack}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}

/**
 * Wrapper component for GradingWizard
 * @returns {React.ReactElement} Wrapped component
 */
export function GradingWizardWrapper() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Handle missing or invalid assignment ID
  if (!id) {
    return (
      <ParameterError
        message="Assignment ID is required to access the grading wizard."
        onGoBack={() => navigate("/teacher/assignments")}
      />
    );
  }

  // Validate that ID is a valid format (optional additional validation)
  if (!/^[a-zA-Z0-9-_]+$/.test(id)) {
    return (
      <ParameterError
        message="Invalid assignment ID format."
        onGoBack={() => navigate("/teacher/assignments")}
      />
    );
  }

  return <GradingWizard assignmentId={id} />;
}

/**
 * Wrapper component for RubricBuilder
 * @returns {React.ReactElement} Wrapped component
 */
export function RubricBuilderWrapper() {
  const { id: assignmentId } = useParams();
  const navigate = useNavigate();
  const [rubric, setRubric] = React.useState({
    criteria: [],
    totalPoints: 0,
    title: "",
    description: "",
  });

  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(/** @type {string | null} */ (null));

  // Load existing rubric if editing
  React.useEffect(() => {
    const loadRubric = async () => {
      if (assignmentId) {
        try {
          setLoading(true);
          const response = await api.get(`/assignments/${assignmentId}/rubric`);
          if (response.data) {
            setRubric(response.data);
          }
        } catch (err) {
          console.error("Error loading rubric:", err);
          // If no rubric exists, continue with empty state
          if (err.response?.status !== 404) {
            setError("Failed to load existing rubric.");
          }
        } finally {
          setLoading(false);
        }
      }
    };

    loadRubric();
  }, [assignmentId]);

  const handleRubricChange = React.useCallback((newRubric) => {
    setRubric(newRubric);
    setError(null); // Clear any previous errors
  }, []);

  const handleSaveRubric = React.useCallback(
    async (rubricData) => {
      try {
        setSaving(true);
        setError(null);

        const payload = {
          ...rubricData,
          assignmentId: assignmentId || null,
        };

        let response;
        if (assignmentId) {
          // Update existing rubric
          response = await api.put(
            `/assignments/${assignmentId}/rubric`,
            payload
          );
        } else {
          // Create new rubric
          response = await api.post("/rubrics", payload);
        }

        toast.success("Rubric saved successfully!");

        // Navigate to assignment management or appropriate page
        if (assignmentId) {
          navigate(`/teacher/assignments/${assignmentId}`);
        } else if (response.data?.id) {
          navigate(`/teacher/rubrics/${response.data.id}`);
        } else {
          navigate("/teacher/assignments");
        }
      } catch (err) {
        const errorMessage =
          err.response?.data?.message ||
          "Failed to save rubric. Please try again.";
        setError(errorMessage);
        toast.error(errorMessage);
        console.error("Save rubric error:", err);
      } finally {
        setSaving(false);
      }
    },
    [assignmentId, navigate]
  );

  const handleCancel = React.useCallback(() => {
    if (assignmentId) {
      navigate(`/teacher/assignments/${assignmentId}`);
    } else {
      navigate("/teacher/assignments");
    }
  }, [assignmentId, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="flex items-center space-x-3">
          <svg
            className="animate-spin w-6 h-6 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span className="text-gray-600">Loading rubric...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {assignmentId ? "Edit Rubric" : "Create Rubric"}
        </h1>
        <button
          onClick={handleCancel}
          className="text-gray-600 hover:text-gray-800 flex items-center"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-red-600 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {saving && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg
              className="animate-spin w-5 h-5 text-blue-600 mr-3"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="text-blue-700">Saving rubric...</span>
          </div>
        </div>
      )}

      <RubricBuilder
        initialRubric={rubric}
        onChange={handleRubricChange}
        readOnly={false}
      />

      <div className="flex justify-end space-x-4 pt-6 border-t">
        <button
          onClick={handleCancel}
          disabled={saving}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => handleSaveRubric(rubric)}
          disabled={saving || !rubric.title.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving
            ? "Saving..."
            : assignmentId
              ? "Update Rubric"
              : "Save Rubric"}
        </button>
      </div>
    </div>
  );
}

/**
 * Wrapper component for SubmissionCard
 * @returns {React.ReactElement} Wrapped component
 */
export function SubmissionCardWrapper() {
  const { id, submissionId } = useParams();
  const navigate = useNavigate();

  const [submission, setSubmission] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [grading, setGrading] = React.useState(false);
  const [downloading, setDownloading] = React.useState(false);

  // Load submission data
  React.useEffect(() => {
    const loadSubmission = async () => {
      try {
        setLoading(true);
        const response = await api.get(
          `/assignments/${id}/submissions/${submissionId}`
        );
        setSubmission(response.data);
      } catch (error) {
        console.error("Error loading submission:", error);
        toast.error("Failed to load submission");
        navigate(`/teacher/assignments/${id}/submissions`);
      } finally {
        setLoading(false);
      }
    };

    if (id && submissionId) {
      loadSubmission();
    }
  }, [id, submissionId, navigate]);

  const handleGrade = React.useCallback(
    async (gradeData) => {
      try {
        setGrading(true);

        const payload = {
          grade: gradeData.points,
          feedback: gradeData.feedback,
          submissionId: submissionId,
        };

        const response = await api.put(
          `/assignments/${id}/submissions/${submissionId}/grade`,
          payload
        );

        setSubmission((prev) => {
          if (!prev || typeof prev !== "object") return null;
          return Object.assign({}, prev, {
            grade: response.data.grade,
            feedback: response.data.feedback,
            status: "graded",
            gradedAt: response.data.gradedAt,
            gradedBy: response.data.gradedBy,
          });
        });

        toast.success("Grade submitted successfully!");
      } catch (error) {
        console.error("Grading error:", error);
        const errorMessage =
          error.response?.data?.message || "Failed to submit grade";
        toast.error(errorMessage);
      } finally {
        setGrading(false);
      }
    },
    [id, submissionId]
  );

  const handleViewDetails = React.useCallback(() => {
    // Navigate to detailed submission view with expanded information
    navigate(`/teacher/assignments/${id}/submissions/${submissionId}/details`);
  }, [navigate, id, submissionId]);

  const handleAddFeedback = React.useCallback(
    async (feedback) => {
      try {
        const payload = {
          feedback: feedback,
          submissionId: submissionId,
        };

        const response = await api.post(
          `/assignments/${id}/submissions/${submissionId}/feedback`,
          payload
        );

        setSubmission((prev) => {
          if (!prev || typeof prev !== "object") return null;
          return Object.assign({}, prev, {
            feedback: response.data.feedback,
            feedbackHistory: response.data.feedbackHistory || [],
          });
        });

        toast.success("Feedback added successfully!");
      } catch (error) {
        console.error("Add feedback error:", error);
        const errorMessage =
          error.response?.data?.message || "Failed to add feedback";
        toast.error(errorMessage);
      }
    },
    [id, submissionId]
  );

  const handleDownload = React.useCallback(async () => {
    try {
      setDownloading(true);

      // Get download URL and metadata
      const response = await api.get(
        `/assignments/${id}/submissions/${submissionId}/download`,
        {
          responseType: "blob",
        }
      );

      // Create blob URL and trigger download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers["content-disposition"];
      let filename = `submission_${submissionId}.zip`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create download link and trigger click
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Download started successfully!");
    } catch (error) {
      console.error("Download error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to download submission";
      toast.error(errorMessage);
    } finally {
      setDownloading(false);
    }
  }, [id, submissionId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="flex items-center space-x-3">
          <svg
            className="animate-spin w-6 h-6 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span className="text-gray-600">Loading submission...</span>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <ParameterError
        message="Submission not found."
        onGoBack={() => navigate(`/teacher/assignments/${id}/submissions`)}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate(`/teacher/assignments/${id}/submissions`)}
          className="flex items-center text-blue-600 hover:text-blue-700"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Submissions
        </button>

        <div className="flex space-x-3">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {downloading ? (
              <>
                <svg
                  className="animate-spin w-4 h-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Downloading...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Download
              </>
            )}
          </button>

          <button
            onClick={handleViewDetails}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            View Details
          </button>
        </div>
      </div>

      {grading && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg
              className="animate-spin w-5 h-5 text-blue-600 mr-3"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="text-blue-700">Processing grade...</span>
          </div>
        </div>
      )}

      <SubmissionCard
        submission={submission}
        onGrade={handleGrade}
        onViewDetails={handleViewDetails}
        onAddFeedback={handleAddFeedback}
        onDownload={handleDownload}
        showGrading={true}
      />
    </div>
  );
}

/**
 * Comment type definition
 * @typedef {object} Comment
 * @property {string} id - Unique comment identifier
 * @property {string} content - Comment text content
 * @property {object} author - Comment author information
 * @property {string} author.name - Author's display name
 * @property {string} author.role - Author's role (teacher, student, etc.)
 * @property {string|null} author.avatar - Author's avatar URL or null
 * @property {string} createdAt - ISO timestamp when comment was created
 * @property {string|null} updatedAt - ISO timestamp when comment was last updated or null
 * @property {Comment[]} [replies] - Optional array of reply comments
 */

/**
 * Wrapper component for CommentThread
 * @returns {React.ReactElement} Wrapped component
 */
export function CommentThreadWrapper() {
  const { user } = useAuth();
  const { id: assignmentId, submissionId } = useParams();

  const [comments, setComments] = React.useState(/** @type {any[]} */ ([]));
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  // Load comments
  React.useEffect(() => {
    const loadComments = async () => {
      try {
        setLoading(true);
        const endpoint = submissionId
          ? `/assignments/${assignmentId}/submissions/${submissionId}/comments`
          : `/assignments/${assignmentId}/comments`;

        const response = await api.get(endpoint);
        const commentsData = response.data || [];
        setComments(commentsData);
      } catch (error) {
        console.error("Error loading comments:", error);
        toast.error("Failed to load comments");
      } finally {
        setLoading(false);
      }
    };

    if (assignmentId) {
      loadComments();
    }
  }, [assignmentId, submissionId]);

  const handleAddComment = React.useCallback(
    async (commentContent) => {
      try {
        setSubmitting(true);

        const payload = {
          content: commentContent,
          assignmentId: assignmentId,
          submissionId: submissionId || null,
        };

        const endpoint = submissionId
          ? `/assignments/${assignmentId}/submissions/${submissionId}/comments`
          : `/assignments/${assignmentId}/comments`;

        const response = await api.post(endpoint, payload);

        const newComment = {
          id: response.data.id,
          content: response.data.content,
          author: {
            name: response.data.author.name,
            role: response.data.author.role,
            avatar: null,
          },
          createdAt: response.data.createdAt,
          updatedAt: null,
          replies: [],
        };

        setComments((prevComments) => [...prevComments, newComment]);
        toast.success("Comment added successfully!");
      } catch (error) {
        console.error("Add comment error:", error);
        const errorMessage =
          error.response?.data?.message || "Failed to add comment";
        toast.error(errorMessage);
      } finally {
        setSubmitting(false);
      }
    },
    [assignmentId, submissionId]
  );

  const handleEditComment = React.useCallback(
    async (id, content) => {
      try {
        const payload = { content };

        const endpoint = submissionId
          ? `/assignments/${assignmentId}/submissions/${submissionId}/comments/${id}`
          : `/assignments/${assignmentId}/comments/${id}`;

        const response = await api.put(endpoint, payload);

        setComments((prevComments) =>
          prevComments.map((comment) =>
            comment.id === id
              ? Object.assign({}, comment, {
                  content: response.data.content,
                  updatedAt: response.data.updatedAt,
                })
              : comment
          )
        );

        toast.success("Comment updated successfully!");
      } catch (error) {
        console.error("Edit comment error:", error);
        const errorMessage =
          error.response?.data?.message || "Failed to update comment";
        toast.error(errorMessage);
      }
    },
    [assignmentId, submissionId]
  );

  const handleDeleteComment = React.useCallback(
    async (id) => {
      try {
        const endpoint = submissionId
          ? `/assignments/${assignmentId}/submissions/${submissionId}/comments/${id}`
          : `/assignments/${assignmentId}/comments/${id}`;

        await api.delete(endpoint);

        setComments((prevComments) =>
          prevComments.filter((comment) => comment.id !== id)
        );
        toast.success("Comment deleted successfully!");
      } catch (error) {
        console.error("Delete comment error:", error);
        const errorMessage =
          error.response?.data?.message || "Failed to delete comment";
        toast.error(errorMessage);
      }
    },
    [assignmentId, submissionId]
  );

  const handleReplyToComment = React.useCallback(
    async (parentId, content) => {
      try {
        const payload = {
          content: content,
          parentId: parentId,
          assignmentId: assignmentId,
          submissionId: submissionId || null,
        };

        const endpoint = submissionId
          ? `/assignments/${assignmentId}/submissions/${submissionId}/comments/${parentId}/replies`
          : `/assignments/${assignmentId}/comments/${parentId}/replies`;

        const response = await api.post(endpoint, payload);

        const newReply = {
          id: response.data.id,
          content: response.data.content,
          author: {
            name: response.data.author.name,
            role: response.data.author.role,
            avatar: null,
          },
          createdAt: response.data.createdAt,
          updatedAt: null,
        };

        setComments((prevComments) =>
          prevComments.map((comment) =>
            comment.id === parentId
              ? Object.assign({}, comment, {
                  replies: [...(comment.replies || []), newReply],
                })
              : comment
          )
        );

        toast.success("Reply added successfully!");
      } catch (error) {
        console.error("Reply to comment error:", error);
        const errorMessage =
          error.response?.data?.message || "Failed to add reply";
        toast.error(errorMessage);
      }
    },
    [assignmentId, submissionId]
  );

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="flex items-center space-x-3">
            <svg
              className="animate-spin w-6 h-6 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="text-gray-600">Loading comments...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-xl font-semibold mb-6">
        {submissionId ? "Submission Discussion" : "Assignment Discussion"}
      </h2>

      <CommentThread
        comments={/** @type {any} */ (comments)}
        onAddComment={handleAddComment}
        onEditComment={handleEditComment}
        onDeleteComment={handleDeleteComment}
        onReplyToComment={handleReplyToComment}
        currentUser={user}
        disabled={submitting}
      />
    </div>
  );
}
