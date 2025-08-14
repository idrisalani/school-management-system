// @ts-nocheck
// client/src/store/api/userApi.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/users",
    prepareHeaders: (headers, { getState }) => {
      // Safe access to auth token
      const state = getState();
      const token = state?.auth?.token;

      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }

      return headers;
    },
  }),
  tagTypes: ["User"],
  endpoints: (builder) => ({
    // Get all users
    getUsers: builder.query({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();

        if (params.role) searchParams.append("role", params.role);
        if (params.status) searchParams.append("status", params.status);
        if (params.search) searchParams.append("search", params.search);
        if (params.page) searchParams.append("page", params.page);
        if (params.limit) searchParams.append("limit", params.limit);

        return `/?${searchParams.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.users.map((user) => ({ type: "User", id: user.id })),
              { type: "User", id: "LIST" },
            ]
          : [{ type: "User", id: "LIST" }],
    }),

    // Get user by ID
    getUserById: builder.query({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: "User", id }],
    }),

    // Create new user
    createUser: builder.mutation({
      query: (newUser) => ({
        url: "/",
        method: "POST",
        body: newUser,
      }),
      invalidatesTags: [{ type: "User", id: "LIST" }],
    }),

    // Update user
    updateUser: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/${id}`,
        method: "PATCH",
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "User", id },
        { type: "User", id: "LIST" },
      ],
    }),

    // Delete user
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "User", id },
        { type: "User", id: "LIST" },
      ],
    }),

    // Get user profile (current user)
    getUserProfile: builder.query({
      query: () => "/profile",
      providesTags: (result) =>
        result ? [{ type: "User", id: result.id }] : [],
    }),

    // Update user profile (current user)
    updateUserProfile: builder.mutation({
      query: (profileData) => ({
        url: "/profile",
        method: "PATCH",
        body: profileData,
      }),
      invalidatesTags: (result) =>
        result ? [{ type: "User", id: result.id }] : [],
    }),

    // Change user password
    changePassword: builder.mutation({
      query: ({ currentPassword, newPassword }) => ({
        url: "/change-password",
        method: "POST",
        body: { currentPassword, newPassword },
      }),
    }),

    // Get users by role
    getUsersByRole: builder.query({
      query: (role) => `/role/${role}`,
      providesTags: (result, error, role) =>
        result
          ? [
              ...result.map((user) => ({ type: "User", id: user.id })),
              { type: "User", id: `ROLE-${role}` },
            ]
          : [{ type: "User", id: `ROLE-${role}` }],
    }),

    // Get user statistics
    getUserStats: builder.query({
      query: () => "/stats",
      providesTags: [{ type: "User", id: "STATS" }],
    }),

    // Bulk operations
    bulkUpdateUsers: builder.mutation({
      query: ({ userIds, updateData }) => ({
        url: "/bulk-update",
        method: "PATCH",
        body: { userIds, updateData },
      }),
      invalidatesTags: [{ type: "User", id: "LIST" }],
    }),

    // Upload user avatar
    uploadAvatar: builder.mutation({
      query: ({ userId, formData }) => ({
        url: `/${userId}/avatar`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: "User", id: userId },
      ],
    }),
  }),
});

// Export hooks for usage in components
export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetUserProfileQuery,
  useUpdateUserProfileMutation,
  useChangePasswordMutation,
  useGetUsersByRoleQuery,
  useGetUserStatsQuery,
  useBulkUpdateUsersMutation,
  useUploadAvatarMutation,
} = userApi;

// Export additional utility functions
export const userApiSlice = userApi;
