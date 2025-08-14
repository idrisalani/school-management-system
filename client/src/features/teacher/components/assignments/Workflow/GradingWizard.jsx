// @ts-nocheck
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Check, Download, Eye } from "lucide-react";
import Button from "../../../../../components/ui/button";
// import Input from '../../../../../components/ui/input';
// import Textarea from '../../../../../components/ui/textarea';
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "../../../../../components/ui/alert";
import Badge from "../../../../../components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "../../../../../components/ui/dialog";

/**
 * @typedef {object} Attachment
 * @property {string} name - File name
 * @property {string} url - File URL
 */

/**
 * @typedef {object} Submission
 * @property {number} id - Submission ID
 * @property {string} studentName - Student name
 * @property {string} submittedAt - Submission date
 * @property {Attachment[]} attachments - Attached files
 * @property {string} status - Submission status
 * @property {number} [grade] - Submission grade
 * @property {string} [feedback] - Teacher's feedback
 */

/**
 * @typedef {object} GradingWizardProps
 * @property {string} assignmentId - Assignment ID
 * @property {(submissions: Submission[]) => void} [onComplete] - Callback when grading is complete
 */

/**
 * Grading wizard component for grading student submissions
 * @param {GradingWizardProps} props - Component properties
 * @returns {React.ReactElement} GradingWizard component
 */
const GradingWizard = ({ assignmentId, onComplete }) => {
  const [submissions, setSubmissions] = useState(
    /** @type {Submission[]} */ ([])
  );
  const [error, setError] = useState(/** @type {string | null} */ (null));
  const [loading, setLoading] = useState(true);
  const [currentSubmission, setCurrentSubmission] = useState(
    /** @type {Submission | null} */ (null)
  );
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        // Mock data - replace with actual API call
        const mockSubmissions = [
          {
            id: 1,
            studentName: "John Doe",
            submittedAt: "2024-01-15T10:30:00",
            attachments: [{ name: "assignment.pdf", url: "#" }],
            status: "pending",
          },
        ];
        setSubmissions(mockSubmissions);
      } catch (err) {
        setError("Failed to load assignment data");
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [assignmentId]);

  /**
   * Handles grading a submission
   * @returns {Promise<void>}
   */
  const handleGrade = async () => {
    if (!currentSubmission) return;

    try {
      const gradeValue = Number(grade);
      if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > 100) {
        setError("Grade must be a number between 0 and 100");
        return;
      }

      // Mock save - replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update submission status and data
      setSubmissions((prev) =>
        prev.map((sub) =>
          sub.id === currentSubmission.id
            ? {
                ...sub,
                status: "graded",
                grade: gradeValue,
                feedback,
              }
            : sub
        )
      );

      setIsDialogOpen(false);
      setGrade("");
      setFeedback("");
      setError(null);

      // Call onComplete if all submissions are graded
      const updatedSubmissions = submissions.map((sub) =>
        sub.id === currentSubmission.id
          ? { ...sub, status: "graded", grade: gradeValue, feedback }
          : sub
      );

      if (
        updatedSubmissions.every((sub) => sub.status === "graded") &&
        onComplete
      ) {
        onComplete(updatedSubmissions);
      }
    } catch (err) {
      setError("Failed to save grade. Please try again.");
    }
  };

  /**
   * Opens the grading dialog for a submission
   * @param {Submission} submission - The submission to grade
   */
  const handleViewSubmission = (submission) => {
    setCurrentSubmission(submission);
    setGrade(submission.grade?.toString() || "");
    setFeedback(submission.feedback || "");
    setIsDialogOpen(true);
  };

  if (loading) {
    return <div className="p-4">Loading submissions...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Submissions List */}
      {submissions.map((submission) => (
        <Card key={submission.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle>{submission.studentName}</CardTitle>
                <p className="text-sm text-gray-500">
                  Submitted: {new Date(submission.submittedAt).toLocaleString()}
                </p>
              </div>
              <Badge
                variant={submission.status === "graded" ? "success" : "default"}
              >
                {submission.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Button
              onClick={() => handleViewSubmission(submission)}
              size="sm"
              className="flex items-center gap-2"
            >
              <Eye size={16} />
              View & Grade
            </Button>
            {submission.attachments?.map((file) => (
              <a
                key={file.name}
                href={file.url}
                download
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-md hover:bg-gray-100"
              >
                <Download size={16} />
                {file.name}
              </a>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Grading Dialog */}
      {currentSubmission && (
        <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
          <DialogContent onClose={() => setIsDialogOpen(false)}>
            <DialogHeader>
              <DialogTitle>Grade Submission</DialogTitle>
              <DialogDescription>
                Grading submission for {currentSubmission.studentName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Grade (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Feedback</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  placeholder="Provide feedback..."
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleGrade} className="flex items-center gap-2">
                <Check size={16} />
                Save Grade
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

GradingWizard.propTypes = {
  assignmentId: PropTypes.string.isRequired,
  onComplete: PropTypes.func,
};

export default GradingWizard;
