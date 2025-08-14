import { useEffect, useCallback, useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import api from "./api.js";

/**
 * @typedef {object} EntityChange
 * @property {string} entityId - The ID of the changed entity
 * @property {*} data - The changed data
 * @property {number} version - Version number of the change
 */

/**
 * @typedef {object} AuthContextValue
 * @property {object|null} user - Currently authenticated user
 * @property {boolean} isAuthenticated - Whether a user is currently authenticated
 * @property {boolean} isLoading - Whether authentication is in progress
 * @property {string|null} error - Current authentication error if any
 */

/**
 * @typedef {object} SyncData
 * @property {{[key: string]: *}} data - The synced data
 * @property {boolean} syncing - Whether sync is in progress
 * @property {function(string, *): Promise<void>} syncChanges - Function to sync changes
 */

class SyncManager {
  constructor() {
    /** @type {WebSocket|null} */
    this.ws = null;
    /** @type {Map<string, number>} */
    this.versionMap = new Map();
    /** @type {Map<string, Set<function(EntityChange): void>>} */
    this.listeners = new Map();
    /** @type {number} */
    this.reconnectAttempts = 0;
    /** @type {number} */
    this.maxReconnectAttempts = 5;
    /** @type {number} */
    this.reconnectDelay = 1000;
    /** @type {Map<string, Map<string, {data: *, timestamp: number}>>} */
    this.pendingChanges = new Map();
  }

  /**
   * Get authentication token from localStorage
   * @returns {string|null} The stored authentication token or null if not found
   */
  _getAuthToken() {
    return localStorage.getItem("token");
  }

  /**
   * Initialize WebSocket connection
   */
  initialize() {
    if (this.ws) {
      this.ws.close();
    }

    const token = this._getAuthToken();
    if (!token) return;

    // Update WebSocket URL configuration
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl =
      process.env.REACT_APP_WS_URL ||
      `${wsProtocol}//${window.location.host}/ws`;

    this.ws = new WebSocket(`${wsUrl}?token=${token}`);

    this.ws.onmessage = this._handleMessage.bind(this);
    this.ws.onclose = this._handleClose.bind(this);
    this.ws.onerror = this._handleError.bind(this);
    this.ws.onopen = this._handleOpen.bind(this);
  }

  /**
   * Handle incoming WebSocket messages
   * @param {MessageEvent} event - WebSocket message event
   */
  _handleMessage(event) {
    try {
      const message = JSON.parse(event.data);

      if (message.type === "sync") {
        const { entityType, change } = message;
        this._applyChange(entityType, change);
      }
    } catch (error) {
      console.error("Error handling sync message:", error);
    }
  }

  /**
   * Handle WebSocket connection close
   */
  _handleClose() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(
        () => {
          this.reconnectAttempts++;
          this.initialize();
        },
        this.reconnectDelay * Math.pow(2, this.reconnectAttempts)
      );
    }
  }

  /**
   * Handle WebSocket errors
   * @param {Event} error - WebSocket error event
   */
  _handleError(error) {
    console.error("WebSocket error:", error);
  }

  /**
   * Handle successful WebSocket connection
   */
  _handleOpen() {
    this.reconnectAttempts = 0;
    this._syncPendingChanges();
  }

  /**
   * Subscribe to entity changes
   * @param {string} entityType - Type of entity to subscribe to
   * @param {function(EntityChange): void} callback - Callback function for changes
   * @returns {function(): void} Unsubscribe function
   */
  subscribe(entityType, callback) {
    if (!this.listeners.has(entityType)) {
      this.listeners.set(entityType, new Set());
    }

    const listeners = this.listeners.get(entityType);
    if (listeners) {
      listeners.add(callback);
    }

    return () => {
      const listeners = this.listeners.get(entityType);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  /**
   * Apply change and notify listeners
   * @param {string} entityType - Type of entity
   * @param {EntityChange} change - Change data
   */
  _applyChange(entityType, change) {
    const version = change.version;
    const currentVersion = this.versionMap.get(entityType) || 0;

    if (version > currentVersion) {
      this.versionMap.set(entityType, version);
      const listeners = this.listeners.get(entityType);

      if (listeners) {
        listeners.forEach((callback) => callback(change));
      }
    }
  }

  /**
   * Queue change for sync
   * @param {string} entityType - Type of entity
   * @param {string} entityId - Entity identifier
   * @param {*} data - Change data
   */
  queueChange(entityType, entityId, data) {
    if (!this.pendingChanges.has(entityType)) {
      this.pendingChanges.set(entityType, new Map());
    }

    const entityChanges = this.pendingChanges.get(entityType);
    if (entityChanges) {
      entityChanges.set(entityId, {
        data,
        timestamp: Date.now(),
      });
    }

    this._syncPendingChanges();
  }

  /**
   * Sync pending changes to the server
   * @returns {Promise<void>}
   */
  async _syncPendingChanges() {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      return;
    }

    for (const [entityType, changes] of this.pendingChanges) {
      for (const [entityId, change] of changes) {
        try {
          await api.post("/sync", {
            entityType,
            entityId,
            data: change.data,
          });

          changes.delete(entityId);
        } catch (error) {
          console.error("Error syncing change:", error);
        }
      }

      if (changes.size === 0) {
        this.pendingChanges.delete(entityType);
      }
    }
  }
}

// Create singleton instance
const syncManager = new SyncManager();

/**
 * React hook for using sync functionality
 * @param {string} entityType - Type of entity to sync
 * @returns {SyncData} Sync methods and state
 */
export const useSync = (entityType) => {
  const { isAuthenticated } = useAuth();
  const [localData, setLocalData] = useState({});
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      syncManager.initialize();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const unsubscribe = syncManager.subscribe(entityType, (change) => {
      setLocalData((prevData) => ({
        ...prevData,
        [change.entityId]: change.data,
      }));
    });

    return () => unsubscribe();
  }, [entityType]);

  const syncChanges = useCallback(
    async (entityId, data) => {
      setSyncing(true);
      try {
        setLocalData((prevData) => ({
          ...prevData,
          [entityId]: data,
        }));

        syncManager.queueChange(entityType, entityId, data);
      } catch (error) {
        console.error("Error syncing changes:", error);
        setLocalData((prevData) => ({
          ...prevData,
          [entityId]: prevData[entityId],
        }));
        throw error;
      } finally {
        setSyncing(false);
      }
    },
    [entityType]
  );

  return {
    data: localData,
    syncing,
    syncChanges,
  };
};

export default syncManager;
