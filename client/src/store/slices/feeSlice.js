// @ts-nocheck

// =============================================================================
// client/src/store/slices/feeSlice.js
// =============================================================================
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  fees: [],
  selectedFee: null,
  paymentStats: {
    totalPaid: 0,
    totalPending: 0,
    totalOverdue: 0,
    monthlyRevenue: 0,
  },
  filters: {
    status: "all",
    type: "all",
    dateRange: null,
    studentId: null,
  },
  loading: false,
  error: null,
};

const feeSlice = createSlice({
  name: "fee",
  initialState,
  reducers: {
    setFees: (state, action) => {
      state.fees = action.payload;
      state.loading = false;
      state.error = null;
    },
    addFee: (state, action) => {
      state.fees.push(action.payload);
    },
    updateFee: (state, action) => {
      const index = state.fees.findIndex((fee) => fee.id === action.payload.id);
      if (index !== -1) {
        state.fees[index] = action.payload;
      }
    },
    removeFee: (state, action) => {
      state.fees = state.fees.filter((fee) => fee.id !== action.payload);
    },
    setSelectedFee: (state, action) => {
      state.selectedFee = action.payload;
    },
    clearFeesError: (state) => {
      state.error = null;
    },
    calculatePaymentStats: (state) => {
      const fees = state.fees;
      state.paymentStats = {
        totalPaid: fees
          .filter((f) => f.status === "paid")
          .reduce((sum, f) => sum + f.amount, 0),
        totalPending: fees
          .filter((f) => f.status === "pending")
          .reduce((sum, f) => sum + f.amount, 0),
        totalOverdue: fees
          .filter((f) => f.status === "overdue")
          .reduce((sum, f) => sum + f.amount, 0),
        monthlyRevenue: fees
          .filter(
            (f) =>
              f.status === "paid" &&
              new Date(f.paidDate).getMonth() === new Date().getMonth()
          )
          .reduce((sum, f) => sum + f.amount, 0),
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
  setFees,
  addFee,
  updateFee,
  removeFee,
  setSelectedFee,
  clearFeesError,
  calculatePaymentStats,
  setLoading,
  setError,
} = feeSlice.actions;

export default feeSlice.reducer;
