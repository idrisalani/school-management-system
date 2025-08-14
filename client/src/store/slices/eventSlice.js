// @ts-nocheck

// =============================================================================
// client/src/store/slices/eventSlice.js
// =============================================================================
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  events: [],
  selectedEvent: null,
  filters: {
    type: "all",
    dateRange: null,
    category: "all",
  },
  loading: false,
  error: null,
};

const eventSlice = createSlice({
  name: "event",
  initialState,
  reducers: {
    setEvents: (state, action) => {
      state.events = action.payload;
      state.loading = false;
      state.error = null;
    },
    addEvent: (state, action) => {
      state.events.push(action.payload);
    },
    updateEvent: (state, action) => {
      const index = state.events.findIndex(
        (event) => event.id === action.payload.id
      );
      if (index !== -1) {
        state.events[index] = action.payload;
      }
    },
    removeEvent: (state, action) => {
      state.events = state.events.filter(
        (event) => event.id !== action.payload
      );
    },
    setSelectedEvent: (state, action) => {
      state.selectedEvent = action.payload;
    },
    clearEventsError: (state) => {
      state.error = null;
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
  setEvents,
  addEvent,
  updateEvent,
  removeEvent,
  setSelectedEvent,
  clearEventsError,
  setLoading,
  setError,
} = eventSlice.actions;

export default eventSlice.reducer;
