// @ts-nocheck

// client/src/features/teacher/components/assignments/context/AnalyticsContext.jsx
import React, { createContext, useContext, useReducer } from "react";

const AnalyticsContext = createContext();

const initialState = {
  metrics: {
    performance: null,
    submission: null,
    trends: null,
  },
  filters: {
    timeRange: "term",
    class: "all",
    subject: "all",
  },
  comparison: {
    enabled: false,
    metric: null,
    period: null,
  },
  view: "overview", // overview, performance, submissions, trends
  loading: false,
  error: null,
};

const analyticsReducer = (state, action) => {
  switch (action.type) {
    case "SET_METRICS":
      return {
        ...state,
        metrics: {
          ...state.metrics,
          ...action.payload,
        },
      };
    case "UPDATE_FILTERS":
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload,
        },
      };
    case "TOGGLE_COMPARISON":
      return {
        ...state,
        comparison: {
          ...state.comparison,
          enabled: !state.comparison.enabled,
        },
      };
    case "SET_COMPARISON_METRIC":
      return {
        ...state,
        comparison: {
          ...state.comparison,
          metric: action.payload,
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

export const AnalyticsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(analyticsReducer, initialState);

  const value = {
    ...state,
    actions: {
      setMetrics: (metrics) =>
        dispatch({ type: "SET_METRICS", payload: metrics }),
      updateFilters: (filters) =>
        dispatch({ type: "UPDATE_FILTERS", payload: filters }),
      toggleComparison: () => dispatch({ type: "TOGGLE_COMPARISON" }),
      setComparisonMetric: (metric) =>
        dispatch({ type: "SET_COMPARISON_METRIC", payload: metric }),
      setView: (view) => dispatch({ type: "SET_VIEW", payload: view }),
      setLoading: (loading) =>
        dispatch({ type: "SET_LOADING", payload: loading }),
      setError: (error) => dispatch({ type: "SET_ERROR", payload: error }),
    },
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalyticsContext = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error(
      "useAnalyticsContext must be used within an AnalyticsProvider"
    );
  }
  return context;
};
