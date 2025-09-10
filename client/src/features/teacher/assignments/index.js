// @ts-nocheck

// client/src/features/teacher/components/assignments/index.js
export { default as AssignmentList } from "./AssignmentList";
export { default as AssignmentWorkflow } from "./AssignmentWorkflow";
export { default as AssignmentManagementSuite } from "./AssignmentManagementSuite";
export { default as AssignmentCreator } from "./creation/AssignmentCreator";
export { default as AssignmentGrader } from "./grading/AssignmentGrader";
export { default as AssignmentAnalytics } from "./analytics/AssignmentAnalytics";

// Shared components
export { default as AssignmentCard } from "./shared/AssignmentCard";
export { default as SubmissionCard } from "./shared/SubmissionCard";
export { default as RubricBuilder } from "./shared/RubricBuilder";
export { default as GradeScaleSelector } from "./shared/GradeScaleSelector";

// Utils and types
export * from "./utils/assignmentTypes";
export * from "./utils/gradeCalculator";
export * from "./utils/validationRules";
