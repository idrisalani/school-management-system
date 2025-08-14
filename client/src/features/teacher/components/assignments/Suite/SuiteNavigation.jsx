// @ts-nocheck
// client/src/features/teacher/components/assignments/Suite/SuiteContext.jsx
import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
} from "react";

// Initial state for the Suite context
const initialState = {
  view: "list", // current view: list, grid, calendar, analytics, settings
  ui: {
    sidebarCollapsed: false,
    filterPanelOpen: true,
    quickActionsPanelOpen: false,
    theme: "light",
  },
  filters: {
    status: "all",
    subject: "all",
    class: "all",
    dateRange: null,
    searchQuery: "",
  },
  selectedItems: [],
  loading: false,
  error: null,
};

// Action types
const ACTIONS = {
  SET_VIEW: "SET_VIEW",
  TOGGLE_UI_ELEMENT: "TOGGLE_UI_ELEMENT",
  SET_UI_ELEMENT: "SET_UI_ELEMENT",
  SET_FILTERS: "SET_FILTERS",
  SET_SELECTED_ITEMS: "SET_SELECTED_ITEMS",
  ADD_SELECTED_ITEM: "ADD_SELECTED_ITEM",
  REMOVE_SELECTED_ITEM: "REMOVE_SELECTED_ITEM",
  CLEAR_SELECTED_ITEMS: "CLEAR_SELECTED_ITEMS",
  SET_LOADING: "SET_LOADING",
  SET_ERROR: "SET_ERROR",
  RESET_STATE: "RESET_STATE",
};

// Reducer function
const suiteReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_VIEW:
      return {
        ...state,
        view: action.payload,
      };

    case ACTIONS.TOGGLE_UI_ELEMENT:
      return {
        ...state,
        ui: {
          ...state.ui,
          [action.payload]: !state.ui[action.payload],
        },
      };

    case ACTIONS.SET_UI_ELEMENT:
      return {
        ...state,
        ui: {
          ...state.ui,
          [action.payload.key]: action.payload.value,
        },
      };

    case ACTIONS.SET_FILTERS:
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload,
        },
      };

    case ACTIONS.SET_SELECTED_ITEMS:
      return {
        ...state,
        selectedItems: action.payload,
      };

    case ACTIONS.ADD_SELECTED_ITEM:
      if (state.selectedItems.includes(action.payload)) {
        return state;
      }
      return {
        ...state,
        selectedItems: [...state.selectedItems, action.payload],
      };

    case ACTIONS.REMOVE_SELECTED_ITEM:
      return {
        ...state,
        selectedItems: state.selectedItems.filter(
          (item) => item !== action.payload
        ),
      };

    case ACTIONS.CLEAR_SELECTED_ITEMS:
      return {
        ...state,
        selectedItems: [],
      };

    case ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    case ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    case ACTIONS.RESET_STATE:
      return initialState;

    default:
      return state;
  }
};

// Create the context
const SuiteContext = createContext();

// Custom hook to use the Suite context
export const useSuiteNavigation = () => {
  const context = useContext(SuiteContext);

  if (!context) {
    // Return default values instead of throwing error for better resilience
    console.warn("useSuiteNavigation must be used within a SuiteProvider");
    return {
      view: "list",
      setView: () => {},
      ui: { sidebarCollapsed: false },
      toggleUIElement: () => {},
      filters: {},
      setFilters: () => {},
      selectedItems: [],
      setSelectedItems: () => {},
      loading: false,
      error: null,
    };
  }

  return context;
};

// Provider component
export const SuiteProvider = ({ children, initialData = {} }) => {
  const [state, dispatch] = useReducer(suiteReducer, {
    ...initialState,
    ...initialData,
  });

  // Action creators
  const setView = useCallback((view) => {
    dispatch({ type: ACTIONS.SET_VIEW, payload: view });
  }, []);

  const toggleUIElement = useCallback((element) => {
    dispatch({ type: ACTIONS.TOGGLE_UI_ELEMENT, payload: element });
  }, []);

  const setUIElement = useCallback((key, value) => {
    dispatch({ type: ACTIONS.SET_UI_ELEMENT, payload: { key, value } });
  }, []);

  const setFilters = useCallback((filters) => {
    dispatch({ type: ACTIONS.SET_FILTERS, payload: filters });
  }, []);

  const setSelectedItems = useCallback((items) => {
    dispatch({ type: ACTIONS.SET_SELECTED_ITEMS, payload: items });
  }, []);

  const addSelectedItem = useCallback((item) => {
    dispatch({ type: ACTIONS.ADD_SELECTED_ITEM, payload: item });
  }, []);

  const removeSelectedItem = useCallback((item) => {
    dispatch({ type: ACTIONS.REMOVE_SELECTED_ITEM, payload: item });
  }, []);

  const clearSelectedItems = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_SELECTED_ITEMS });
  }, []);

  const setLoading = useCallback((loading) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: loading });
  }, []);

  const setError = useCallback((error) => {
    dispatch({ type: ACTIONS.SET_ERROR, payload: error });
  }, []);

  const resetState = useCallback(() => {
    dispatch({ type: ACTIONS.RESET_STATE });
  }, []);

  // Context value
  const value = {
    // State
    view: state.view,
    ui: state.ui,
    filters: state.filters,
    selectedItems: state.selectedItems,
    loading: state.loading,
    error: state.error,

    // Actions
    setView,
    toggleUIElement,
    setUIElement,
    setFilters,
    setSelectedItems,
    addSelectedItem,
    removeSelectedItem,
    clearSelectedItems,
    setLoading,
    setError,
    resetState,

    // Computed values
    hasSelectedItems: state.selectedItems.length > 0,
    selectedItemsCount: state.selectedItems.length,
    isFilterActive: Object.values(state.filters).some(
      (value) => value !== "all" && value !== null && value !== ""
    ),
  };

  return (
    <SuiteContext.Provider value={value}>{children}</SuiteContext.Provider>
  );
};

// HOC for components that need Suite context
export const withSuiteContext = (Component) => {
  const WrappedComponent = (props) => (
    <SuiteProvider>
      <Component {...props} />
    </SuiteProvider>
  );

  // Set display name for better debugging
  WrappedComponent.displayName = `withSuiteContext(${Component.displayName || Component.name || "Component"})`;

  return WrappedComponent;
};

// Utility hooks
export const useSuiteFilters = () => {
  const { filters, setFilters, isFilterActive } = useSuiteNavigation();

  const updateFilter = useCallback(
    (key, value) => {
      setFilters({ [key]: value });
    },
    [setFilters]
  );

  const clearFilters = useCallback(() => {
    setFilters({
      status: "all",
      subject: "all",
      class: "all",
      dateRange: null,
      searchQuery: "",
    });
  }, [setFilters]);

  return {
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    isFilterActive,
  };
};

export const useSuiteSelection = () => {
  const {
    selectedItems,
    setSelectedItems,
    addSelectedItem,
    removeSelectedItem,
    clearSelectedItems,
    hasSelectedItems,
    selectedItemsCount,
  } = useSuiteNavigation();

  const toggleItemSelection = useCallback(
    (item) => {
      if (selectedItems.includes(item)) {
        removeSelectedItem(item);
      } else {
        addSelectedItem(item);
      }
    },
    [selectedItems, addSelectedItem, removeSelectedItem]
  );

  const selectAll = useCallback(
    (items) => {
      setSelectedItems(items);
    },
    [setSelectedItems]
  );

  const isItemSelected = useCallback(
    (item) => {
      return selectedItems.includes(item);
    },
    [selectedItems]
  );

  return {
    selectedItems,
    hasSelectedItems,
    selectedItemsCount,
    toggleItemSelection,
    selectAll,
    clearSelectedItems,
    isItemSelected,
  };
};

export default SuiteContext;
