// @ts-nocheck
//client\src\store\slices\assignmentSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  assignments: [],
  selectedAssignment: null,
  submissions: [],
  filters: {
    class: null,
    subject: null,
    status: "all",
    dateRange: null,
  },
  sortBy: "dueDate",
  sortOrder: "desc",
};

const assignmentSlice = createSlice({
  name: "assignment",
  initialState,
  reducers: {
    setAssignments: (state, action) => {
      state.assignments = action.payload;
    },
    setSelectedAssignment: (state, action) => {
      state.selectedAssignment = action.payload;
    },
    addAssignment: (state, action) => {
      state.assignments.push(action.payload);
    },
    updateAssignment: (state, action) => {
      const index = state.assignments.findIndex(
        (a) => a.id === action.payload.id
      );
      if (index !== -1) {
        state.assignments[index] = {
          ...state.assignments[index],
          ...action.payload,
        };
      }
    },
    deleteAssignment: (state, action) => {
      state.assignments = state.assignments.filter(
        (a) => a.id !== action.payload
      );
    },
    setSubmissions: (state, action) => {
      state.submissions = action.payload;
    },
    updateSubmission: (state, action) => {
      const index = state.submissions.findIndex(
        (s) => s.id === action.payload.id
      );
      if (index !== -1) {
        state.submissions[index] = {
          ...state.submissions[index],
          ...action.payload,
        };
      }
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setSorting: (state, action) => {
      state.sortBy = action.payload.sortBy;
      state.sortOrder = action.payload.sortOrder;
    },
  },
});

export const {
  setAssignments,
  setSelectedAssignment,
  addAssignment,
  updateAssignment,
  deleteAssignment,
  setSubmissions,
  updateSubmission,
  setFilters,
  setSorting,
} = assignmentSlice.actions;
export default assignmentSlice.reducer;
