// =============================================================================
// client/src/store/slices/attendanceSlice.js
// =============================================================================
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  records: [],
  selectedDate: new Date().toISOString().split("T")[0],
  selectedClass: null,
  filters: {
    dateRange: null,
    classId: null,
    status: "all",
  },
  stats: {
    present: 0,
    absent: 0,
    late: 0,
    total: 0,
  },
  loading: false,
  error: null,
};

const attendanceSlice = createSlice({
  name: "attendance",
  initialState,
  reducers: {
    setAttendanceRecords: (state, action) => {
      state.records = action.payload;
      state.loading = false;
      state.error = null;
    },
    setSelectedDate: (state, action) => {
      state.selectedDate = action.payload;
    },
    setSelectedClass: (state, action) => {
      state.selectedClass = action.payload;
    },
    setAttendanceFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearAttendanceData: (state) => {
      state.records = [];
      state.selectedClass = null;
    },
    clearAttendanceError: (state) => {
      state.error = null;
    },
    calculateStats: (state) => {
      const records = state.records;
      state.stats = {
        present: records.filter((r) => r.status === "present").length,
        absent: records.filter((r) => r.status === "absent").length,
        late: records.filter((r) => r.status === "late").length,
        total: records.length,
      };
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const {
  setAttendanceRecords,
  setSelectedDate,
  setSelectedClass,
  setAttendanceFilters,
  clearAttendanceData,
  clearAttendanceError,
  calculateStats,
  setLoading,
  setError,
} = attendanceSlice.actions;

export default attendanceSlice.reducer;
