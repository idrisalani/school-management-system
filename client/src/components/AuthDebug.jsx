// @ts-nocheck
// client/src/components/AuthDebug.jsx - Authentication Debug Component
import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api.js";

/**
 * @typedef {object} TestResult
 * @property {boolean} success - Whether the test was successful
 * @property {any} [data] - Response data when successful
 * @property {number} [status] - HTTP status code
 * @property {string} [error] - Error message when failed
 * @property {any} [details] - Additional error details
 */

/**
 * @typedef {object} DebugInfo
 * @property {TestResult | null} backendHealth - Backend health test result
 * @property {TestResult | null} dbConnection - Database connection test result
 * @property {TestResult | null} authTest - Auth route test result
 * @property {TestResult | null} loginTest - Login test result
 * @property {string | null} currentToken - Current authentication token
 * @property {object} environment - Environment information
 * @property {string | undefined} environment.apiUrl - API URL from environment
 * @property {string | undefined} environment.nodeEnv - Node environment
 */

/**
 * @typedef {object} TestCredentials
 * @property {string} email - Test email address
 * @property {string} password - Test password
 */

const AuthDebug = () => {
  /** @type {[DebugInfo, React.Dispatch<React.SetStateAction<DebugInfo>>]} */
  const [debugInfo, setDebugInfo] = useState(
    /** @type {DebugInfo} */ ({
      backendHealth: null,
      dbConnection: null,
      authTest: null,
      loginTest: null,
      currentToken: null,
      environment: {
        apiUrl: process.env.REACT_APP_API_URL,
        nodeEnv: process.env.NODE_ENV,
      },
    })
  );

  const [isLoading, setIsLoading] = useState(false);

  /** @type {[TestCredentials, React.Dispatch<React.SetStateAction<TestCredentials>>]} */
  const [testCredentials, setTestCredentials] = useState(
    /** @type {TestCredentials} */ ({
      email: "admin@schoolms.com",
      password: "admin123",
    })
  );

  // Test backend health
  const testBackendHealth = useCallback(async () => {
    try {
      console.log("🏥 Testing backend health...");
      const response = await api.health.check();
      setDebugInfo((prev) => ({
        ...prev,
        backendHealth: {
          success: true,
          data: response.data,
          status: response.status,
        },
      }));
      console.log("✅ Backend health OK:", response.data);
    } catch (error) {
      console.error("❌ Backend health failed:", error);
      setDebugInfo((prev) => ({
        ...prev,
        backendHealth: {
          success: false,
          error: error.message,
          details: error.response?.data,
        },
      }));
    }
  }, []);

  // Test database connection
  const testDbConnection = useCallback(async () => {
    try {
      console.log("🔌 Testing database connection...");
      const response = await api.health.dbTest();
      setDebugInfo((prev) => ({
        ...prev,
        dbConnection: {
          success: true,
          data: response.data,
          status: response.status,
        },
      }));
      console.log("✅ Database connection OK:", response.data);
    } catch (error) {
      console.error("❌ Database connection failed:", error);
      setDebugInfo((prev) => ({
        ...prev,
        dbConnection: {
          success: false,
          error: error.message,
          details: error.response?.data,
        },
      }));
    }
  }, []);

  // Test auth route accessibility
  const testAuthRoute = useCallback(async () => {
    try {
      console.log("🛣️ Testing auth route...");
      const apiUrl = process.env.REACT_APP_API_URL;
      const response = await fetch(`${apiUrl}/api/v1/auth/test`);
      const data = await response.json();

      setDebugInfo((prev) => ({
        ...prev,
        authTest: {
          success: response.ok,
          data: data,
          status: response.status,
        },
      }));
      console.log("✅ Auth route OK:", data);
    } catch (error) {
      console.error("❌ Auth route failed:", error);
      setDebugInfo((prev) => ({
        ...prev,
        authTest: {
          success: false,
          error: error.message,
        },
      }));
    }
  }, []);

  // Test login with credentials
  const testLogin = useCallback(async () => {
    try {
      console.log("🔐 Testing login...");
      setIsLoading(true);

      const response = await api.auth.login(
        testCredentials.email,
        testCredentials.password
      );

      setDebugInfo((prev) => ({
        ...prev,
        loginTest: {
          success: true,
          data: response.data,
          status: response.status,
        },
      }));

      // Store token for further testing
      if (response.data.data?.accessToken) {
        localStorage.setItem("token", response.data.data.accessToken);
        setDebugInfo((prev) => ({
          ...prev,
          currentToken: response.data.data.accessToken,
        }));
      } else if (response.data.accessToken) {
        localStorage.setItem("token", response.data.accessToken);
        setDebugInfo((prev) => ({
          ...prev,
          currentToken: response.data.accessToken,
        }));
      } else if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        setDebugInfo((prev) => ({
          ...prev,
          currentToken: response.data.token,
        }));
      }

      console.log("✅ Login test OK:", response.data);
    } catch (error) {
      console.error("❌ Login test failed:", error);
      setDebugInfo((prev) => ({
        ...prev,
        loginTest: {
          success: false,
          error: error.message,
          details: error.response?.data,
          status: error.response?.status,
        },
      }));
    } finally {
      setIsLoading(false);
    }
  }, [testCredentials.email, testCredentials.password]);

  // Run all tests
  const runAllTests = useCallback(async () => {
    setIsLoading(true);
    console.log("🚀 Running all debug tests...");

    await testBackendHealth();
    await testDbConnection();
    await testAuthRoute();

    setIsLoading(false);
  }, [testBackendHealth, testDbConnection, testAuthRoute]);

  // Check current token on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    setDebugInfo((prev) => ({
      ...prev,
      currentToken: token,
    }));
  }, []);

  // Auto-run tests on mount
  useEffect(() => {
    runAllTests();
  }, [runAllTests]);

  /**
   * Component to display test results
   * @param {object} props - Component props
   * @param {TestResult | null} props.test - Test result to display
   * @param {string} props.title - Title of the test
   * @returns {JSX.Element} Test result component
   */
  const TestResult = ({ test, title }) => {
    if (!test) return <div className="text-gray-500">Not tested</div>;

    if (test.success) {
      return (
        <div className="text-green-600">
          <div className="font-semibold">✅ {title} - SUCCESS</div>
          <pre className="text-xs mt-1 bg-green-50 p-2 rounded overflow-auto max-h-32">
            {JSON.stringify(test.data, null, 2)}
          </pre>
        </div>
      );
    } else {
      return (
        <div className="text-red-600">
          <div className="font-semibold">❌ {title} - FAILED</div>
          <div className="text-sm mt-1">Error: {test.error}</div>
          {test.status && <div className="text-sm">Status: {test.status}</div>}
          {test.details && (
            <pre className="text-xs mt-1 bg-red-50 p-2 rounded overflow-auto max-h-32">
              {JSON.stringify(test.details, null, 2)}
            </pre>
          )}
        </div>
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          🔧 Authentication Debug Panel
        </h2>
        <p className="text-gray-600">
          Use this panel to debug authentication issues in development.
        </p>
      </div>

      {/* Environment Info */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">
          Environment
        </h3>
        <div className="space-y-1 text-sm">
          <div>
            <strong>API URL:</strong>{" "}
            {debugInfo.environment.apiUrl || "Not set"}
          </div>
          <div>
            <strong>Node ENV:</strong>{" "}
            {debugInfo.environment.nodeEnv || "Not set"}
          </div>
          <div>
            <strong>Current Token:</strong>{" "}
            {debugInfo.currentToken
              ? `${debugInfo.currentToken.substring(0, 20)}...`
              : "None"}
          </div>
        </div>
      </div>

      {/* Test Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={runAllTests}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Running Tests..." : "🔄 Run All Tests"}
          </button>
          <button
            onClick={testBackendHealth}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            🏥 Test Health
          </button>
          <button
            onClick={testDbConnection}
            disabled={isLoading}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            🔌 Test Database
          </button>
          <button
            onClick={testAuthRoute}
            disabled={isLoading}
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
          >
            🛣️ Test Auth Route
          </button>
        </div>

        {/* Login Test Controls */}
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-2">🔐 Login Test</h4>
          <div className="flex gap-2 mb-2">
            <input
              type="email"
              value={testCredentials.email}
              onChange={(e) =>
                setTestCredentials((prev) => ({
                  ...prev,
                  email: e.target.value,
                }))
              }
              placeholder="Email"
              className="border rounded px-3 py-1 flex-1"
            />
            <input
              type="password"
              value={testCredentials.password}
              onChange={(e) =>
                setTestCredentials((prev) => ({
                  ...prev,
                  password: e.target.value,
                }))
              }
              placeholder="Password"
              className="border rounded px-3 py-1 flex-1"
            />
            <button
              onClick={testLogin}
              disabled={isLoading}
              className="px-4 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              Test Login
            </button>
          </div>
          <div className="text-xs text-gray-600">
            Default credentials: admin@schoolms.com / admin123
          </div>
        </div>
      </div>

      {/* Test Results */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Test Results
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <TestResult
                test={debugInfo.backendHealth}
                title="Backend Health"
              />
            </div>

            <div className="border rounded-lg p-4">
              <TestResult
                test={debugInfo.dbConnection}
                title="Database Connection"
              />
            </div>

            <div className="border rounded-lg p-4">
              <TestResult test={debugInfo.authTest} title="Auth Route" />
            </div>

            <div className="border rounded-lg p-4">
              <TestResult test={debugInfo.loginTest} title="Login Test" />
            </div>
          </div>
        </div>
      </div>

      {/* Debug Instructions */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-2">
          🔍 Debug Instructions
        </h4>
        <div className="text-sm text-gray-600 space-y-1">
          <div>
            1. <strong>Backend Health</strong> should return status "success"
            with database info
          </div>
          <div>
            2. <strong>Database Connection</strong> should show "connected:
            true"
          </div>
          <div>
            3. <strong>Auth Route</strong> should return available endpoints
          </div>
          <div>
            4. <strong>Login Test</strong> should return user data and access
            token
          </div>
          <div className="mt-2 text-orange-600">
            <strong>
              If any test fails, check the browser console for detailed error
              logs.
            </strong>
          </div>
        </div>
      </div>

      {/* Quick Fixes Section */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h4 className="font-semibold text-yellow-800 mb-2">🛠️ Common Fixes</h4>
        <div className="text-sm text-yellow-700 space-y-2">
          <div>
            <strong>Backend Health Fails:</strong> Check if server is running on
            correct port
          </div>
          <div>
            <strong>Database Connection Fails:</strong> Verify MongoDB
            connection string in environment variables
          </div>
          <div>
            <strong>Auth Route Fails:</strong> Check CORS configuration and API
            URL
          </div>
          <div>
            <strong>Login Fails:</strong> Verify user exists in database with
            correct credentials
          </div>
          <div className="mt-2 p-2 bg-yellow-100 rounded">
            <strong>💡 Tip:</strong> Run the backend in development mode to see
            detailed error logs
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthDebug;
