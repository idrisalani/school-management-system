// @ts-nocheck

//client\src\store\slices\userSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  users: [],
  selectedUser: null,
  userCount: 0,
  roles: [],
  filters: {
    role: null,
    searchTerm: "",
    status: "all",
  },
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUsers: (state, action) => {
      state.users = action.payload;
      state.userCount = action.payload.length;
    },
    setSelectedUser: (state, action) => {
      state.selectedUser = action.payload;
    },
    addUser: (state, action) => {
      state.users.push(action.payload);
      state.userCount += 1;
    },
    updateUser: (state, action) => {
      const index = state.users.findIndex(
        (user) => user.id === action.payload.id
      );
      if (index !== -1) {
        state.users[index] = { ...state.users[index], ...action.payload };
      }
    },
    deleteUser: (state, action) => {
      state.users = state.users.filter((user) => user.id !== action.payload);
      state.userCount -= 1;
    },
    setRoles: (state, action) => {
      state.roles = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
  },
});

export const {
  setUsers,
  setSelectedUser,
  addUser,
  updateUser,
  deleteUser,
  setRoles,
  setFilters,
} = userSlice.actions;
export default userSlice.reducer;
