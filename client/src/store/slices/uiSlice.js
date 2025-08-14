// @ts-nocheck

//client\src\store\slices\uiSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isLoading: false,
  error: null,
  successMessage: null,
  currentModal: null,
  modalData: null,
  sidebarOpen: true,
  theme: "light",
  notifications: [],
  breadcrumbs: [],
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setSuccessMessage: (state, action) => {
      state.successMessage = action.payload;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    openModal: (state, action) => {
      state.currentModal = action.payload.modalType;
      state.modalData = action.payload.data;
    },
    closeModal: (state) => {
      state.currentModal = null;
      state.modalData = null;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    addNotification: (state, action) => {
      state.notifications.push(action.payload);
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        (n) => n.id !== action.payload
      );
    },
    setBreadcrumbs: (state, action) => {
      state.breadcrumbs = action.payload;
    },
  },
});

export const {
  setLoading,
  setError,
  clearError,
  setSuccessMessage,
  clearSuccessMessage,
  openModal,
  closeModal,
  toggleSidebar,
  setTheme,
  addNotification,
  removeNotification,
  setBreadcrumbs,
} = uiSlice.actions;
export default uiSlice.reducer;
