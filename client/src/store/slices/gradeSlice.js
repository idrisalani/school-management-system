//client\src\store\slices\gradeSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  grades: {},  // Organized by student ID
  selectedStudent: null,
  gradeReports: {},
  filters: {
    class: null,
    subject: null,
    term: null,
    gradeRange: null
  },
  statistics: {
    classAverages: {},
    subjectAverages: {},
    distribution: {}
  }
};

const gradeSlice = createSlice({
  name: 'grade',
  initialState,
  reducers: {
    setGrades: (state, action) => {
      state.grades = action.payload;
    },
    updateGrade: (state, action) => {
      const { studentId, subjectId, grade } = action.payload;
      if (!state.grades[studentId]) {
        state.grades[studentId] = {};
      }
      state.grades[studentId][subjectId] = grade;
    },
    setSelectedStudent: (state, action) => {
      state.selectedStudent = action.payload;
    },
    setGradeReport: (state, action) => {
      const { studentId, report } = action.payload;
      state.gradeReports[studentId] = report;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    updateStatistics: (state, action) => {
      state.statistics = { ...state.statistics, ...action.payload };
    }
  }
});

export const {
  setGrades,
  updateGrade,
  setSelectedStudent,
  setGradeReport,
  setFilters,
  updateStatistics
} = gradeSlice.actions;
export default gradeSlice.reducer;