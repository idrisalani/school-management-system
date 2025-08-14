// @ts-nocheck

//teacher/components/assignments/shared/SubmissionCard.jsx
import React, { useState } from "react";
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  Eye,
  MessageSquare,
  Edit2,
  User,
  Calendar,
  Paperclip,
} from "lucide-react";

const SubmissionCard = ({
  submission,
  onGrade,
  onViewDetails,
  onAddFeedback,
  onDownload,
  showGrading = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusDetails = (status) => {
    const statusConfig = {
      submitted: {
        icon: CheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-100",
        label: "Submitted",
      },
      late: {
        icon: Clock,
        color: "text-yellow-600",
        bgColor: "bg-yellow-100",
        label: "Late",
      },
      missing: {
        icon: AlertCircle,
        color: "text-red-600",
        bgColor: "bg-red-100",
        label: "Missing",
      },
      graded: {
        icon: CheckCircle,
        color: "text-blue-600",
        bgColor: "bg-blue-100",
        label: "Graded",
      },
    };

    return statusConfig[status] || statusConfig.submitted;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const StatusBadge = ({ status }) => {
    const { icon: Icon, color, bgColor, label } = getStatusDetails(status);
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${color}`}
      >
        <Icon size={14} className="mr-1" />
        {label}
      </span>
    );
  };

  const { student, submittedAt, status, files, grade, feedback } = submission;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
              {student.avatar || <User size={20} className="text-gray-500" />}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                {student.name}
              </h3>
              <p className="text-sm text-gray-500">{student.id}</p>
            </div>
          </div>
          <StatusBadge status={status} />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Submission Time */}
        <div className="flex items-center text-sm text-gray-500">
          <Calendar size={16} className="mr-2" />
          Submitted {formatDate(submittedAt)}
        </div>

        {/* Files */}
        {files && files.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">
              Attached Files ({files.length})
            </p>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    <Paperclip size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <span className="text-xs text-gray-500">
                      ({formatFileSize(file.size)})
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onDownload?.(file)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <Download size={16} className="text-gray-500" />
                    </button>
                    <button
                      onClick={() => onViewDetails?.(file)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <Eye size={16} className="text-gray-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grading Section */}
        {showGrading && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Grade</p>
                  {grade ? (
                    <p className="text-2xl font-bold text-gray-900">
                      {grade.score}/{grade.total}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">Not graded</p>
                  )}
                </div>
                {grade && (
                  <div className="text-sm">
                    <p className="text-gray-500">Percentage</p>
                    <p className="font-medium text-gray-900">
                      {((grade.score / grade.total) * 100).toFixed(1)}%
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={() => onGrade?.(submission)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Edit2 size={16} className="mr-1.5" />
                {grade ? "Edit Grade" : "Grade"}
              </button>
            </div>

            {/* Feedback */}
            {(feedback || isExpanded) && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Feedback
                </p>
                {feedback ? (
                  <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700">
                    {feedback}
                  </div>
                ) : (
                  <button
                    onClick={() => onAddFeedback?.()}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                  >
                    <MessageSquare size={16} className="mr-1.5" />
                    Add Feedback
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          {isExpanded ? "Show Less" : "Show More"}
        </button>
      </div>
    </div>
  );
};

export default SubmissionCard;
