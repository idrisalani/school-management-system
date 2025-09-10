// @ts-check

/**
 * @typedef {object} AssignmentSubmissions
 * @property {number} submitted - Number of submitted assignments
 * @property {number} total - Total number of expected submissions
 */

/**
 * @typedef {object} BaseAssignment
 * @property {string|number} id - Assignment ID
 * @property {string} title - Assignment title
 * @property {string} status - Assignment status
 * @property {string} [subject] - Assignment subject
 * @property {string} [class] - Class name
 * @property {string} [dueDate] - Due date
 * @property {AssignmentSubmissions} [submissions] - Submission statistics
 */

/**
 * @typedef {BaseAssignment} BulkActionAssignment
 */

/**
 * @typedef {Required<Omit<BaseAssignment, 'submissions'>> & { submissions?: AssignmentSubmissions }} Assignment
 */

/**
 * Converts a bulk action assignment to a full assignment with all required fields
 * @param {BulkActionAssignment} assignment - The bulk action assignment to convert
 * @returns {Assignment} A complete assignment with all required fields populated
 */
export const toFullAssignment = (assignment) => ({
  id: assignment.id,
  title: assignment.title,
  status: assignment.status,
  subject: assignment.subject ?? "",
  class: assignment.class ?? "",
  dueDate: assignment.dueDate ?? new Date().toISOString(),
  ...(assignment.submissions && { submissions: assignment.submissions }),
});

/**
 * Converts a full assignment to a bulk action assignment with minimal fields
 * @param {Assignment} assignment - The full assignment to convert
 * @returns {BulkActionAssignment} A minimal assignment for bulk actions
 */
export const toBulkActionAssignment = (assignment) => ({
  id: assignment.id,
  title: assignment.title,
  status: assignment.status,
});

export {};
