// src/hooks/useApi.js
import { useState, useCallback, useRef } from "react";
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:3000/api";

/**
 * Custom hook for making API calls with automatic loading, error handling, and request cancellation
 * @returns {object} API handling methods and state
 */
const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllersRef = useRef(new Map());

  /**
   * Handles API errors and formats them appropriately
   * @param {Error|object} error - The error object from the API call
   * @returns {string} Formatted error message
   */
  const handleError = useCallback((error) => {
    if (axios.isCancel(error)) {
      return "Request cancelled";
    }

    if (!error.response) {
      return "Network error. Please check your connection.";
    }

    switch (error.response.status) {
      case 400:
        return (
          error.response.data?.message ||
          "Invalid request. Please check your input."
        );
      case 401:
        localStorage.removeItem("token");
        window.location.href = "/login";
        return "Your session has expired. Please log in again.";
      case 403:
        return "You do not have permission to perform this action.";
      case 404:
        return "The requested resource was not found.";
      case 422:
        return (
          error.response.data?.message ||
          "Validation error. Please check your input."
        );
      case 429:
        return "Too many requests. Please try again later.";
      case 500:
        return "Server error. Please try again later.";
      default:
        return "An unexpected error occurred. Please try again.";
    }
  }, []);

  /**
   * Makes an API request with automatic error handling and loading state
   * @param {string} endpoint - API endpoint
   * @param {object} options - Request options
   * @param {string} [options.method='GET'] - HTTP method
   * @param {object} [options.data] - Request payload
   * @param {object} [options.headers] - Custom headers
   * @param {boolean} [options.skipLoading=false] - Skip loading state
   * @param {boolean} [options.skipError=false] - Skip error handling
   * @returns {Promise<*>} API response
   */
  const request = useCallback(
    async (endpoint, options = {}) => {
      const {
        method = "GET",
        data,
        headers = {},
        skipLoading = false,
        skipError = false,
      } = options;

      // Create abort controller for this request
      const controller = new AbortController();
      const requestId = endpoint + method;

      // Cancel any existing request to the same endpoint
      if (abortControllersRef.current.has(requestId)) {
        abortControllersRef.current.get(requestId).abort();
      }
      abortControllersRef.current.set(requestId, controller);

      try {
        if (!skipLoading) setLoading(true);
        if (error) setError(null);

        const response = await axios({
          url: `${API_BASE_URL}${endpoint}`,
          method,
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          data,
          signal: controller.signal,
          withCredentials: true,
        });

        return response.data;
      } catch (err) {
        if (!skipError) {
          const errorMessage = handleError(err);
          setError(errorMessage);
        }
        throw err;
      } finally {
        if (!skipLoading) setLoading(false);
        abortControllersRef.current.delete(requestId);
      }
    },
    [error, handleError]
  );

  /**
   * Wrapper for GET requests
   * @param {string} endpoint - API endpoint
   * @param {object} [options] - Request options
   * @returns {Promise<*>} API response
   */
  const get = useCallback(
    (endpoint, options = {}) => {
      return request(endpoint, { ...options, method: "GET" });
    },
    [request]
  );

  /**
   * Wrapper for POST requests
   * @param {string} endpoint - API endpoint
   * @param {object} data - Request payload
   * @param {object} [options] - Request options
   * @returns {Promise<*>} API response
   */
  const post = useCallback(
    (endpoint, data, options = {}) => {
      return request(endpoint, { ...options, method: "POST", data });
    },
    [request]
  );

  /**
   * Wrapper for PUT requests
   * @param {string} endpoint - API endpoint
   * @param {object} data - Request payload
   * @param {object} [options] - Request options
   * @returns {Promise<*>} API response
   */
  const put = useCallback(
    (endpoint, data, options = {}) => {
      return request(endpoint, { ...options, method: "PUT", data });
    },
    [request]
  );

  /**
   * Wrapper for PATCH requests
   * @param {string} endpoint - API endpoint
   * @param {object} data - Request payload
   * @param {object} [options] - Request options
   * @returns {Promise<*>} API response
   */
  const patch = useCallback(
    (endpoint, data, options = {}) => {
      return request(endpoint, { ...options, method: "PATCH", data });
    },
    [request]
  );

  /**
   * Wrapper for DELETE requests
   * @param {string} endpoint - API endpoint
   * @param {object} [options] - Request options
   * @returns {Promise<*>} API response
   */
  const del = useCallback(
    (endpoint, options = {}) => {
      return request(endpoint, { ...options, method: "DELETE" });
    },
    [request]
  );

  /**
   * Uploads files to the API
   * @param {string} endpoint - API endpoint
   * @param {FormData} formData - Form data containing files
   * @param {object} [options] - Request options
   * @returns {Promise<*>} API response
   */
  const upload = useCallback(
    async (endpoint, formData, options = {}) => {
      const { headers = {}, ...rest } = options;

      return request(endpoint, {
        ...rest,
        method: "POST",
        data: formData,
        headers: {
          ...headers,
          "Content-Type": "multipart/form-data",
        },
      });
    },
    [request]
  );

  /**
   * Downloads a file from the API
   * @param {string} endpoint - API endpoint
   * @param {string} filename - Desired filename
   * @param {object} [options] - Request options
   * @returns {Promise<*>} API response
   */
  const download = useCallback(
    async (endpoint, filename, options = {}) => {
      try {
        setLoading(true);
        const response = await axios({
          url: `${API_BASE_URL}${endpoint}`,
          method: "GET",
          responseType: "blob",
          ...options,
          withCredentials: true,
        });

        const blob = new Blob([response.data]);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        return response;
      } catch (err) {
        const errorMessage = handleError(err);
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [handleError]
  );

  /**
   * Cancels all pending requests
   * @returns {void}
   */
  const cancelAll = useCallback(() => {
    abortControllersRef.current.forEach((controller) => controller.abort());
    abortControllersRef.current.clear();
  }, []);

  return {
    loading,
    error,
    setError,
    request,
    get,
    post,
    put,
    patch,
    delete: del,
    upload,
    download,
    cancelAll,
  };
};

export default useApi;
