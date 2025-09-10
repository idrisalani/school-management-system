// @ts-nocheck
// client/src/features/teacher/components/assignments/shared/AssignmentCard.jsx
import React from "react";
import {
  Calendar,
  Users,
  Edit,
  Trash2,
  Copy,
  FileText,
  BookOpen,
  PresentationChart,
  Calculator,
  Clipboard,
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreHorizontal,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const AssignmentCard = ({
  assignment,
  onEdit,
  onDelete,
  onDuplicate,
  onView,
  view = "default",
  showActions = true,
  isSelected = false,
  onSelect,
}) => {
  const getStatusColor = (status) => {
    const colors = {
      active: "bg-green-100 text-green-800 border-green-200",
      draft: "bg-gray-100 text-gray-800 border-gray-200",
      closed: "bg-red-100 text-red-800 border-red-200",
      published: "bg-blue-100 text-blue-800 border-blue-200",
      archived: "bg-yellow-100 text-yellow-800 border-yellow-200",
    };
    return colors[status] || colors.draft;
  };

  const getTypeIcon = (type) => {
    const icons = {
      homework: BookOpen,
      project: PresentationChart,
      quiz: Calculator,
      test: Clipboard,
      essay: FileText,
      assignment: FileText,
      exam: Award,
    };
    const IconComponent = icons[type?.toLowerCase()] || FileText;
    return <IconComponent size={16} />;
  };

  const getStatusIcon = (status) => {
    const icons = {
      active: CheckCircle,
      draft: Clock,
      closed: AlertCircle,
      published: CheckCircle,
      archived: AlertCircle,
    };
    const IconComponent = icons[status] || Clock;
    return <IconComponent size={12} />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No due date";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? "s" : ""}`;
    } else if (diffDays === 0) {
      return "Due today";
    } else if (diffDays === 1) {
      return "Due tomorrow";
    } else if (diffDays <= 7) {
      return `Due in ${diffDays} days`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-yellow-500";
    if (percentage >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  const handleCardClick = () => {
    if (onView && typeof onView === "function") {
      onView(assignment.id);
    }
  };

  const handleSelect = (e) => {
    e.stopPropagation();
    if (onSelect && typeof onSelect === "function") {
      onSelect(assignment.id, !isSelected);
    }
  };

  const submissionPercentage =
    assignment.submissions?.total > 0
      ? Math.round(
          (assignment.submissions.submitted / assignment.submissions.total) *
            100
        )
      : 0;

  const gradingPercentage =
    assignment.submissions?.total > 0
      ? Math.round(
          (assignment.submissions.graded / assignment.submissions.total) * 100
        )
      : 0;

  return (
    <Card
      className={`
      hover:shadow-md transition-all duration-200 cursor-pointer
      ${isSelected ? "ring-2 ring-blue-500 shadow-md" : ""}
      ${view === "compact" ? "hover:shadow-sm" : ""}
    `}
    >
      <CardContent
        className={`
        ${view === "compact" ? "p-3" : "p-4"}
      `}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            {/* Selection Checkbox */}
            {onSelect && (
              <div className="pt-1">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={handleSelect}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Type Icon */}
            <div
              className={`
              p-2 rounded-lg border flex-shrink-0
              ${getStatusColor(assignment.status)}
            `}
            >
              {getTypeIcon(assignment.type)}
            </div>

            {/* Assignment Info */}
            <div className="min-w-0 flex-1" onClick={handleCardClick}>
              <div className="flex items-center space-x-2 mb-1">
                <h3
                  className={`
                  font-medium text-gray-900 truncate
                  ${view === "compact" ? "text-sm" : "text-base"}
                `}
                >
                  {assignment.title}
                </h3>
                <div className="flex items-center space-x-1">
                  {getStatusIcon(assignment.status)}
                  <span
                    className={`
                    px-2 py-1 rounded-full text-xs font-medium capitalize
                    ${getStatusColor(assignment.status)}
                  `}
                  >
                    {assignment.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>{assignment.class}</span>
                <span>•</span>
                <span>{assignment.subject}</span>
                {assignment.points && (
                  <>
                    <span>•</span>
                    <span>{assignment.points} pts</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex items-center space-x-1 ml-2">
              {view !== "compact" && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.(assignment.id);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit assignment"
                  >
                    <Edit size={14} className="text-gray-600" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate?.(assignment.id);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Duplicate assignment"
                  >
                    <Copy size={14} className="text-gray-600" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.(assignment.id);
                    }}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-500"
                    title="Delete assignment"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}

              {view === "compact" && (
                <div className="relative group">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreHorizontal size={14} className="text-gray-600" />
                  </button>
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit?.(assignment.id);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <Edit size={12} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicate?.(assignment.id);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <Copy size={12} />
                      <span>Duplicate</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete?.(assignment.id);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <Trash2 size={12} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Detailed View Content */}
        {view === "detailed" && (
          <>
            {/* Description */}
            {assignment.description && (
              <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                {assignment.description}
              </p>
            )}

            {/* Stats Grid */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2 text-sm">
                <Calendar size={14} className="text-gray-400" />
                <div>
                  <div className="text-gray-900 font-medium">
                    {formatDate(assignment.dueDate)}
                  </div>
                  {assignment.dueDate && (
                    <div className="text-xs text-gray-500">
                      {new Date(assignment.dueDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 text-sm">
                <Users size={14} className="text-gray-400" />
                <div>
                  <div className="text-gray-900 font-medium">
                    {assignment.submissions?.submitted || 0}/
                    {assignment.submissions?.total || 0} Submitted
                  </div>
                  <div className="text-xs text-gray-500">
                    {submissionPercentage}% completion
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bars */}
            <div className="mt-4 space-y-3">
              {/* Submission Progress */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-600">Submissions</span>
                  <span className="text-xs text-gray-500">
                    {submissionPercentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(submissionPercentage)}`}
                    style={{ width: `${submissionPercentage}%` }}
                  />
                </div>
              </div>

              {/* Grading Progress */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-600">Grading</span>
                  <span className="text-xs text-gray-500">
                    {gradingPercentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(gradingPercentage)}`}
                    style={{ width: `${gradingPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Footer Stats */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
              <div className="text-xs text-gray-500">
                {assignment.submissions?.graded || 0} Graded
              </div>
              {assignment.averageScore !== undefined && (
                <div className="text-xs text-gray-900 font-medium">
                  Average: {assignment.averageScore}%
                </div>
              )}
            </div>
          </>
        )}

        {/* Compact View Content */}
        {view === "compact" && (
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-2">
              <Calendar size={12} />
              <span>{formatDate(assignment.dueDate)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users size={12} />
              <span>
                {assignment.submissions?.submitted || 0}/
                {assignment.submissions?.total || 0}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export { AssignmentCard };
