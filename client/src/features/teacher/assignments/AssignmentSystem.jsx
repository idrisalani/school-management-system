// @ts-nocheck
import React from "react";
import { Routes, Route, useParams } from "react-router-dom";
import PropTypes from "prop-types";

// Context Providers
import { AssignmentProvider } from "./context/AssignmentContext";
import { GradingProvider } from "./context/GradingContext";
import { AnalyticsProvider } from "./context/AnalyticsContext";

// Components
import { ErrorBoundary } from "./components/ErrorBoundary";
import AssignmentList from "./List/AssignmentList";
import { AssignmentAnalytics } from "./analytics/AssignmentAnalytics";
import GradingWizard from "./Workflow/GradingWizard";

/**
 * Grading wrapper component
 * @returns {React.ReactElement} Grading component with ID
 */
const GradingWrapper = () => {
  const { id } = useParams();
  return <GradingWizard assignmentId={id} />;
};

/**
 * Assignment system component with context providers and routing
 * @param {object} props - Component properties
 * @param {React.ReactNode} [props.children] - Optional child components
 * @returns {React.ReactElement} AssignmentSystem component
 */
const AssignmentSystem = ({ children }) => {
  return (
    <ErrorBoundary>
      <AssignmentProvider>
        <GradingProvider>
          <AnalyticsProvider>
            {children || (
              <Routes>
                <Route index element={<AssignmentList />} />
                <Route path="grade/:id" element={<GradingWrapper />} />
                <Route path="analytics/*" element={<AssignmentAnalytics />} />
              </Routes>
            )}
          </AnalyticsProvider>
        </GradingProvider>
      </AssignmentProvider>
    </ErrorBoundary>
  );
};

AssignmentSystem.propTypes = {
  children: PropTypes.node,
};

export default AssignmentSystem;
