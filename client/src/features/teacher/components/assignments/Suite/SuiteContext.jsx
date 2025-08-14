// @ts-nocheck
// teacher/components/assignments/Suite/SuiteContext.jsx
import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
} from "react";
import { useAssignment } from "../hooks/useAssignment";
import { useAnalytics } from "../hooks/useAnalytics";
import { useGrading } from "../hooks/useGrading";

const SuiteContext = createContext(null);

const initialState = {
  view: "list",
  selectedAssignments: [],
  filters: {
    status: "all",
    class: "all",
    subject: "all",
    dateRange: "all",
    search: "",
  },
  sorting: {
    field: "dueDate",
    direction: "asc",
  },
  pagination: {
    page: 1,
    perPage: 10,
  },
  settings: {
    showArchived: false,
    autoSave: true,
    notificationsEnabled: true,
  },
  ui: {
    sidebarOpen: true,
    filterPanelOpen: false,
    bulkActionsVisible: false,
  },
};

const suiteReducer = (state, action) => {
  switch (action.type) {
    case "SET_VIEW":
      return {
        ...state,
        view: action.payload,
      };

    case "SET_SELECTED_ASSIGNMENTS":
      return {
        ...state,
        selectedAssignments: action.payload,
        ui: {
          ...state.ui,
          bulkActionsVisible: action.payload.length > 0,
        },
      };

    case "UPDATE_FILTERS":
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload,
        },
        pagination: {
          ...state.pagination,
          page: 1, // Reset page when filters change
        },
      };

    case "UPDATE_SORTING":
      return {
        ...state,
        sorting: action.payload,
      };

    case "SET_PAGE":
      return {
        ...state,
        pagination: {
          ...state.pagination,
          page: action.payload,
        },
      };

    case "UPDATE_SETTINGS":
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,
        },
      };

    case "TOGGLE_UI_ELEMENT":
      return {
        ...state,
        ui: {
          ...state.ui,
          [action.payload]: !state.ui[action.payload],
        },
      };

    case "RESET_FILTERS":
      return {
        ...state,
        filters: initialState.filters,
        pagination: {
          ...state.pagination,
          page: 1,
        },
      };

    case "RESET_STATE":
      return {
        ...initialState,
        settings: state.settings, // Preserve user settings
      };

    default:
      return state;
  }
};

export const SuiteProvider = ({ children }) => {
  const [state, dispatch] = useReducer(suiteReducer, initialState);
  const assignment = useAssignment();
  const analytics = useAnalytics();
  const grading = useGrading();

  // Computed values
  const totalPages = Math.ceil(
    assignment.assignments.length / state.pagination.perPage
  );

  // Action creators
  const actions = {
    setView: (view) => dispatch({ type: "SET_VIEW", payload: view }),

    selectAssignments: (assignments) =>
      dispatch({ type: "SET_SELECTED_ASSIGNMENTS", payload: assignments }),

    updateFilters: useCallback(
      (filters) => {
        dispatch({ type: "UPDATE_FILTERS", payload: filters });
        assignment.fetchAssignments(filters);
      },
      [assignment]
    ),

    updateSorting: (field) => {
      const direction =
        state.sorting.field === field && state.sorting.direction === "asc"
          ? "desc"
          : "asc";
      dispatch({
        type: "UPDATE_SORTING",
        payload: { field, direction },
      });
    },

    setPage: (page) => {
      if (page >= 1 && page <= totalPages) {
        dispatch({ type: "SET_PAGE", payload: page });
      }
    },

    updateSettings: (settings) => {
      dispatch({ type: "UPDATE_SETTINGS", payload: settings });
      // Persist settings to localStorage
      localStorage.setItem(
        "suiteSettings",
        JSON.stringify({
          ...state.settings,
          ...settings,
        })
      );
    },

    toggleUIElement: (element) =>
      dispatch({ type: "TOGGLE_UI_ELEMENT", payload: element }),

    resetFilters: () => dispatch({ type: "RESET_FILTERS" }),

    resetState: () => dispatch({ type: "RESET_STATE" }),

    // Bulk actions
    async performBulkAction(action, assignments) {
      try {
        switch (action) {
          case "archive":
            await assignment.bulkUpdateStatus(assignments, "archived");
            break;
          case "delete":
            await Promise.all(
              assignments.map((id) => assignment.deleteAssignment(id))
            );
            break;
          case "export": {
            const data = await analytics.exportData(assignments);
            // Create and trigger download of the exported data
            const blob = new Blob([JSON.stringify(data, null, 2)], {
              type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `assignments_export_${new Date().toISOString().split("T")[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            break;
          }
          default:
            console.warn("Unknown bulk action:", action);
        }
        // Clear selection after successful action
        dispatch({ type: "SET_SELECTED_ASSIGNMENTS", payload: [] });
        // Refresh assignments
        assignment.fetchAssignments(state.filters);
      } catch (error) {
        console.error("Bulk action failed:", error);
        throw error;
      }
    },
  };

  // Load saved settings on mount
  React.useEffect(() => {
    const savedSettings = localStorage.getItem("suiteSettings");
    if (savedSettings) {
      dispatch({
        type: "UPDATE_SETTINGS",
        payload: JSON.parse(savedSettings),
      });
    }
  }, []);

  const value = {
    // State
    ...state,
    totalPages,
    totalAssignments: assignment.assignments.length,

    // Actions
    ...actions,

    // Assignment operations
    ...assignment,

    // Analytics
    analytics: analytics,

    // Grading
    grading: grading,
  };

  return (
    <SuiteContext.Provider value={value}>{children}</SuiteContext.Provider>
  );
};

export const useSuite = () => {
  const context = useContext(SuiteContext);
  if (!context) {
    throw new Error("useSuite must be used within a SuiteProvider");
  }
  return context;
};

// Specialized hooks for specific features
export const useSuiteNavigation = () => {
  const { view, setView, ui, toggleUIElement } = useSuite();
  return { view, setView, ui, toggleUIElement };
};

export const useSuiteFilters = () => {
  const { filters, updateFilters, resetFilters } = useSuite();
  return { filters, updateFilters, resetFilters };
};

export const useSuitePagination = () => {
  const { pagination, totalPages, setPage } = useSuite();
  return { ...pagination, totalPages, setPage };
};

export const useSuiteBulkActions = () => {
  const { selectedAssignments, selectAssignments, performBulkAction } =
    useSuite();
  return { selectedAssignments, selectAssignments, performBulkAction };
};

export default SuiteContext;
