// client/src/utils/axiosConfig.js - Enhanced Configuration
import axios from "axios";

// 🔥 Enhanced API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

console.log("API Base URL:", API_BASE_URL); // Debug log

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased timeout for Vercel cold starts
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

// Request interceptor with better error handling
axiosInstance.interceptors.request.use(
  (config) => {
    console.log(
      `🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`
    );

    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor with enhanced error handling
axiosInstance.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    console.error("❌ API Error:", {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data,
    });

    // Handle network errors
    if (!error.response) {
      console.error("🌐 Network Error - Backend might be down");
      throw new Error(
        "Network error - please check your connection and try again"
      );
    }

    // Handle CORS errors
    if (error.message.includes("CORS")) {
      console.error("🚫 CORS Error - Backend CORS configuration issue");
      throw new Error("CORS error - please contact support");
    }

    // Handle timeout errors
    if (error.code === "ECONNABORTED") {
      console.error("⏰ Request Timeout");
      throw new Error("Request timeout - server is taking too long to respond");
    }

    // Handle token expiration
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        console.log("🔄 Attempting token refresh...");
        const { data } = await axiosInstance.post("/auth/refresh");
        localStorage.setItem("token", data.token);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error("❌ Token refresh failed:", refreshError);
        // If refresh fails, logout user
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    // Handle specific error codes
    switch (error.response?.status) {
      case 400:
        throw new Error(error.response.data?.message || "Bad request");
      case 403:
        throw new Error("Access denied");
      case 404:
        throw new Error("Resource not found");
      case 409:
        throw new Error(error.response.data?.message || "Conflict error");
      case 422:
        throw new Error(error.response.data?.message || "Validation error");
      case 500:
        throw new Error("Server error - please try again later");
      default:
        throw new Error(error.response?.data?.message || "An error occurred");
    }
  }
);

// Test connection function
export const testConnection = async () => {
  try {
    console.log("🔍 Testing API connection...");
    const response = await axiosInstance.get("/api/v1/health");
    console.log("✅ API Connection successful:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ API Connection failed:", error.message);
    throw error;
  }
};

// Enhanced registration function
export const registerUser = async (userData) => {
  try {
    console.log("📝 Registering user:", {
      email: userData.email,
      role: userData.role,
    });
    const response = await axiosInstance.post(
      "/api/v1/auth/register",
      userData
    );
    console.log("✅ Registration successful");
    return response.data;
  } catch (error) {
    console.error("❌ Registration failed:", error.message);
    throw error;
  }
};

export default axiosInstance;
