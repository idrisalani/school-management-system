// @ts-nocheck

// =============================================================================
// client/src/store/slices/messageSlice.js
// =============================================================================
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  messages: [],
  selectedMessage: null,
  unreadCount: 0,
  filters: {
    type: "all",
    read: "all",
    sender: null,
  },
  loading: false,
  error: null,
};

const messageSlice = createSlice({
  name: "message",
  initialState,
  reducers: {
    setMessages: (state, action) => {
      state.messages = action.payload;
      state.loading = false;
      state.error = null;
    },
    addMessage: (state, action) => {
      state.messages.unshift(action.payload);
      if (!action.payload.read) {
        state.unreadCount += 1;
      }
    },
    updateMessage: (state, action) => {
      const index = state.messages.findIndex(
        (msg) => msg.id === action.payload.id
      );
      if (index !== -1) {
        state.messages[index] = action.payload;
      }
    },
    removeMessage: (state, action) => {
      state.messages = state.messages.filter(
        (msg) => msg.id !== action.payload
      );
    },
    setSelectedMessage: (state, action) => {
      state.selectedMessage = action.payload;
    },
    clearMessagesError: (state) => {
      state.error = null;
    },
    updateUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
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
  setMessages,
  addMessage,
  updateMessage,
  removeMessage,
  setSelectedMessage,
  clearMessagesError,
  updateUnreadCount,
  setLoading,
  setError,
} = messageSlice.actions;

export default messageSlice.reducer;
