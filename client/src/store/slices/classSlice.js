// @ts-nocheck

//client\src\store\slices\classSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  classes: [],
  selectedClass: null,
  subjects: [],
  schedules: {},
  filters: {
    grade: null,
    teacher: null,
    subject: null,
    status: "active",
  },
};

const classSlice = createSlice({
  name: "class",
  initialState,
  reducers: {
    setClasses: (state, action) => {
      state.classes = action.payload;
    },
    setSelectedClass: (state, action) => {
      state.selectedClass = action.payload;
    },
    addClass: (state, action) => {
      state.classes.push(action.payload);
    },
    updateClass: (state, action) => {
      const index = state.classes.findIndex((c) => c.id === action.payload.id);
      if (index !== -1) {
        state.classes[index] = { ...state.classes[index], ...action.payload };
      }
    },
    deleteClass: (state, action) => {
      state.classes = state.classes.filter((c) => c.id !== action.payload);
    },
    setSubjects: (state, action) => {
      state.subjects = action.payload;
    },
    setSchedule: (state, action) => {
      state.schedules[action.payload.classId] = action.payload.schedule;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
  },
});

export const {
  setClasses,
  setSelectedClass,
  addClass,
  updateClass,
  deleteClass,
  setSubjects,
  setSchedule,
  setFilters,
} = classSlice.actions;
export default classSlice.reducer;
