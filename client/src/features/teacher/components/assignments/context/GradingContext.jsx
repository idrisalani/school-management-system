// @ts-nocheck

// client/src/features/teacher/components/assignments/context/GradingContext.jsx
import React, { createContext, useContext, useReducer } from "react";

const GradingContext = createContext();

const initialState = {
  currentSubmission: null,
  gradingCriteria: [],
  feedback: "",
  rubricScores: {},
  overallScore: null,
  status: "pending", // pending, grading, completed
  history: [],
  loading: false,
  error: null,
};

const gradingReducer = (state, action) => {
  switch (action.type) {
    case "SET_CURRENT_SUBMISSION":
      return {
        ...state,
        currentSubmission: action.payload,
        status: "grading",
      };
    case "UPDATE_RUBRIC_SCORES":
      return {
        ...state,
        rubricScores: {
          ...state.rubricScores,
          ...action.payload,
        },
      };
    case "SET_FEEDBACK":
      return {
        ...state,
        feedback: action.payload,
      };
    case "SET_OVERALL_SCORE":
      return {
        ...state,
        overallScore: action.payload,
      };
    case "COMPLETE_GRADING":
      return {
        ...state,
        status: "completed",
        history: [
          ...state.history,
          {
            submissionId: state.currentSubmission.id,
            score: state.overallScore,
            timestamp: new Date().toISOString(),
          },
        ],
      };
    case "RESET_GRADING":
      return {
        ...initialState,
      };
    default:
      return state;
  }
};

export const GradingProvider = ({ children }) => {
  const [state, dispatch] = useReducer(gradingReducer, initialState);

  const value = {
    ...state,
    actions: {
      setCurrentSubmission: (submission) =>
        dispatch({ type: "SET_CURRENT_SUBMISSION", payload: submission }),
      updateRubricScores: (scores) =>
        dispatch({ type: "UPDATE_RUBRIC_SCORES", payload: scores }),
      setFeedback: (feedback) =>
        dispatch({ type: "SET_FEEDBACK", payload: feedback }),
      setOverallScore: (score) =>
        dispatch({ type: "SET_OVERALL_SCORE", payload: score }),
      completeGrading: () => dispatch({ type: "COMPLETE_GRADING" }),
      resetGrading: () => dispatch({ type: "RESET_GRADING" }),
    },
  };

  return (
    <GradingContext.Provider value={value}>{children}</GradingContext.Provider>
  );
};

export const useGradingContext = () => {
  const context = useContext(GradingContext);
  if (!context) {
    throw new Error("useGradingContext must be used within a GradingProvider");
  }
  return context;
};
