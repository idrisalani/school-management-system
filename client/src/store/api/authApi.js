// @ts-nocheck
// client/src/store/api/authApi.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({
  baseUrl: "/api/auth",
  prepareHeaders: (headers, { getState }) => {
    // Get token from localStorage or state
    const token = localStorage.getItem("token") || getState().auth.token;

    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }

    headers.set("Content-Type", "application/json");
    return headers;
  },
});

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery,
  tagTypes: ["User", "Auth"],
  endpoints: (builder) => ({
    // Login
    login: builder.mutation({
      query: ({ email, password }) => ({
        url: "/login",
        method: "POST",
        body: { email, password },
      }),
      invalidatesTags: ["Auth"],
    }),

    // Register
    register: builder.mutation({
      query: (userData) => ({
        url: "/register",
        method: "POST",
        body: userData,
      }),
    }),

    // Logout
    logout: builder.mutation({
      query: () => ({
        url: "/logout",
        method: "POST",
      }),
      invalidatesTags: ["Auth"],
    }),

    // Verify token
    verifyToken: builder.query({
      query: () => "/verify",
      providesTags: ["Auth"],
    }),

    // Request password reset
    requestPasswordReset: builder.mutation({
      query: ({ email }) => ({
        url: "/password-reset",
        method: "POST",
        body: { email },
      }),
    }),

    // Reset password
    resetPassword: builder.mutation({
      query: ({ token, newPassword }) => ({
        url: "/password-reset/confirm",
        method: "POST",
        body: { token, newPassword },
      }),
    }),

    // Refresh token
    refreshToken: builder.mutation({
      query: () => ({
        url: "/refresh",
        method: "POST",
      }),
      invalidatesTags: ["Auth"],
    }),

    // Get current user profile
    getCurrentUser: builder.query({
      query: () => "/me",
      providesTags: ["User"],
    }),

    // Update profile
    updateProfile: builder.mutation({
      query: (updates) => ({
        url: "/profile",
        method: "PATCH",
        body: updates,
      }),
      invalidatesTags: ["User"],
    }),

    // Change password
    changePassword: builder.mutation({
      query: ({ currentPassword, newPassword }) => ({
        url: "/change-password",
        method: "POST",
        body: { currentPassword, newPassword },
      }),
    }),

    // Verify email
    verifyEmail: builder.mutation({
      query: ({ token }) => ({
        url: "/verify-email",
        method: "POST",
        body: { token },
      }),
    }),

    // Resend verification email
    resendVerification: builder.mutation({
      query: () => ({
        url: "/resend-verification",
        method: "POST",
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useVerifyTokenQuery,
  useRequestPasswordResetMutation,
  useResetPasswordMutation,
  useRefreshTokenMutation,
  useGetCurrentUserQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useVerifyEmailMutation,
  useResendVerificationMutation,
} = authApi;
