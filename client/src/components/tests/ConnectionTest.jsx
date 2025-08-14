// client/src/components/tests/ConnectionTest.jsx
import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useSync } from "../../services/syncService";

const ConnectionTest = () => {
  const [status, setStatus] = useState({});
  const { login, isAuthenticated } = useAuth();
  const { syncChanges } = useSync("test");

  // Test API Health
  const testApiHealth = async () => {
    try {
      await fetch("/api/v1/health");
      setStatus((prev) => ({ ...prev, health: "API Health Check: ✅" }));
    } catch (error) {
      setStatus((prev) => ({ ...prev, health: "API Health Check: ❌" }));
      console.error("Health check failed:", error);
    }
  };

  // Test Authentication
  const testAuth = async () => {
    try {
      await login({
        email: "test@example.com",
        password: "password123",
      });
      setStatus((prev) => ({ ...prev, auth: "Authentication: ✅" }));
    } catch (error) {
      setStatus((prev) => ({ ...prev, auth: "Authentication: ❌" }));
      console.error("Auth test failed:", error);
    }
  };

  // Test WebSocket
  const testWebSocket = async () => {
    try {
      await syncChanges("test-id", { message: "test" });
      setStatus((prev) => ({ ...prev, websocket: "WebSocket: ✅" }));
    } catch (error) {
      setStatus((prev) => ({ ...prev, websocket: "WebSocket: ❌" }));
      console.error("WebSocket test failed:", error);
    }
  };

  // Run all tests
  const runAllTests = async () => {
    setStatus({});
    await testApiHealth();
    await testAuth();
    if (isAuthenticated) {
      await testWebSocket();
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Connection Test</h2>

      <button
        onClick={runAllTests}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        Run Tests
      </button>

      <div className="space-y-2">
        {Object.entries(status).map(([key, value]) => (
          <div key={key} className="p-2 border rounded">
            {value}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConnectionTest;
