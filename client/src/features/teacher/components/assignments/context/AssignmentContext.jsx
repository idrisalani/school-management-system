// @ts-nocheck

// client/src/features/teacher/components/assignments/context/AssignmentContext.jsx
import React, { createContext, useContext, useReducer } from "react";

const AssignmentContext = createContext();

const initialState = {
  assignments: [],
  selectedAssignment: null,
  submissions: [],
  filters: {
    class: "all",
    status: "all",
    type: "all",
    dateRange: "all",
  },
  view: "list", // list, create, grade, analytics
  loading: false,
  error: null,
};

const assignmentReducer = (state, action) => {
  switch (action.type) {
    case "SET_ASSIGNMENTS":
      return {
        ...state,
        assignments: action.payload,
      };
    case "SELECT_ASSIGNMENT":
      return {
        ...state,
        selectedAssignment: action.payload,
      };
    case "SET_SUBMISSIONS":
      return {
        ...state,
        submissions: action.payload,
      };
    case "UPDATE_FILTERS":
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload,
        },
      };
    case "SET_VIEW":
      return {
        ...state,
        view: action.payload,
      };
    case "SET_LOADING":
      return {
        ...state,
        loading: action.payload,
      };
    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
      };
    default:
      return state;
  }
};

export const AssignmentProvider = ({ children }) => {
  const [state, dispatch] = useReducer(assignmentReducer, initialState);

  const value = {
    ...state,
    dispatch,
    actions: {
      setAssignments: (assignments) =>
        dispatch({ type: "SET_ASSIGNMENTS", payload: assignments }),
      selectAssignment: (assignment) =>
        dispatch({ type: "SELECT_ASSIGNMENT", payload: assignment }),
      setSubmissions: (submissions) =>
        dispatch({ type: "SET_SUBMISSIONS", payload: submissions }),
      updateFilters: (filters) =>
        dispatch({ type: "UPDATE_FILTERS", payload: filters }),
      setView: (view) => dispatch({ type: "SET_VIEW", payload: view }),
      setLoading: (loading) =>
        dispatch({ type: "SET_LOADING", payload: loading }),
      setError: (error) => dispatch({ type: "SET_ERROR", payload: error }),
    },
  };

  return (
    <AssignmentContext.Provider value={value}>
      {children}
    </AssignmentContext.Provider>
  );
};

export const useAssignmentContext = () => {
  const context = useContext(AssignmentContext);
  if (!context) {
    throw new Error(
      "useAssignmentContext must be used within an AssignmentProvider"
    );
  }
  return context;
};
