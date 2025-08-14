// server/src/services/websocket.js
import { WebSocket, WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";

/**
 * @typedef {object} TokenPayload
 * @property {string} id - User ID
 * @property {string} role - User role
 * @property {string} [email] - User email
 * @property {number} iat - Issued at timestamp
 * @property {number} exp - Expiration timestamp
 */

/**
 * @typedef {import('jsonwebtoken').JwtPayload} JwtPayload
 */

// Ensure JWT secret is available
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  logger.error("JWT_SECRET is not defined in environment variables");
  process.exit(1);
}

/**
 * Type guard for TokenPayload
 * @param {any} payload - Value to check
 * @returns {payload is TokenPayload} - True if payload is TokenPayload
 */
const isTokenPayload = (payload) => {
  return (
    typeof payload === "object" &&
    payload !== null &&
    typeof payload.id === "string" &&
    typeof payload.role === "string" &&
    typeof payload.iat === "number" &&
    typeof payload.exp === "number"
  );
};

/**
 * Verify and decode JWT token
 * @param {string} token - JWT token to verify
 * @returns {TokenPayload} Decoded token payload
 * @throws {Error} If token is invalid
 */
const verifyToken = (token) => {
  if (typeof JWT_SECRET !== "string") {
    throw new Error("Invalid JWT_SECRET configuration");
  }

  const decoded = jwt.verify(token, JWT_SECRET);

  if (!isTokenPayload(decoded)) {
    throw new Error("Invalid token payload");
  }

  return decoded;
};

class WebSocketService {
  constructor(server) {
    this.wss = new WebSocketServer({ server });
    this.clients = new Map();
    this.subscriptions = new Map();
    this.initialize();
  }

  initialize() {
    this.wss.on("connection", async (ws, req) => {
      try {
        // Parse URL safely
        let token;
        try {
          const url = new URL(
            req.url || "",
            `http://${req.headers.host || "localhost"}`
          );
          token = url.searchParams.get("token");
        } catch (error) {
          logger.error("Invalid WebSocket URL:", error);
          ws.close(4001, "Invalid connection URL");
          return;
        }

        // Validate token
        if (!token) {
          logger.warn("WebSocket connection attempt without token");
          ws.close(4001, "Authentication required");
          return;
        }

        // Verify JWT token
        let decoded;
        try {
          decoded = verifyToken(token);
        } catch (error) {
          logger.error("JWT verification failed:", error);
          ws.close(4002, "Authentication failed");
          return;
        }

        const userId = decoded.id;

        // Store client connection
        const existingClient = this.clients.get(userId);
        if (existingClient) {
          if (existingClient.readyState === WebSocket.OPEN) {
            existingClient.close(4003, "New connection established");
          }
        }
        this.clients.set(userId, ws);

        // Handle messages
        ws.on("message", (message) => {
          try {
            this.handleMessage(userId, message);
          } catch (error) {
            logger.error("Error handling WebSocket message:", error);
            this.sendErrorToClient(ws, "Error processing message");
          }
        });

        // Handle client disconnect
        ws.on("close", () => {
          this.handleDisconnect(userId);
        });

        // Handle errors
        ws.on("error", (error) => {
          logger.error(`WebSocket error for user ${userId}:`, error);
          this.handleDisconnect(userId);
        });

        // Send initial connection success message
        this.sendToClient(ws, {
          type: "connected",
          userId: userId,
          role: decoded.role,
        });

        logger.info(`WebSocket client connected: ${userId}`);
      } catch (error) {
        logger.error("WebSocket connection error:", error);
        ws.close(4002, "Connection initialization failed");
      }
    });
  }

  /**
   * Send message to WebSocket client
   * @param {WebSocket} client - WebSocket client
   * @param {object} data - Message data
   */
  sendToClient(client, data) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(JSON.stringify(data));
      } catch (error) {
        logger.error("Error sending message to client:", error);
      }
    }
  }

  /**
   * Send error message to WebSocket client
   * @param {WebSocket} client - WebSocket client
   * @param {string} message - Error message
   */
  sendErrorToClient(client, message) {
    this.sendToClient(client, {
      type: "error",
      message,
    });
  }

  /**
   * Handle client disconnection
   * @param {string} userId - User ID
   */
  handleDisconnect(userId) {
    // Remove from all subscriptions
    this.subscriptions.forEach((subscribers, channel) => {
      subscribers.delete(userId);
      if (subscribers.size === 0) {
        this.subscriptions.delete(channel);
      }
    });

    // Remove from clients
    this.clients.delete(userId);
    logger.info(`WebSocket client disconnected: ${userId}`);
  }

  /**
   * Handle subscription to a channel
   * @param {string} userId - User ID
   * @param {string} channel - Channel name
   */
  handleSubscription(userId, channel) {
    let subscribers = this.subscriptions.get(channel);
    if (!subscribers) {
      subscribers = new Set();
      this.subscriptions.set(channel, subscribers);
    }

    subscribers.add(userId);
    this.sendToUser(userId, {
      type: "subscribed",
      channel,
    });
    logger.debug(`User ${userId} subscribed to channel ${channel}`);
  }

  /**
   * Handle unsubscription from a channel
   * @param {string} userId - User ID
   * @param {string} channel - Channel name
   */
  handleUnsubscription(userId, channel) {
    const subscribers = this.subscriptions.get(channel);
    if (subscribers) {
      subscribers.delete(userId);
      if (subscribers.size === 0) {
        this.subscriptions.delete(channel);
      }
      this.sendToUser(userId, {
        type: "unsubscribed",
        channel,
      });
      logger.debug(`User ${userId} unsubscribed from channel ${channel}`);
    }
  }

  /**
   * Get subscribers for a channel
   * @param {string} channel - Channel name
   * @returns {Set<string>} Set of subscriber IDs
   */
  getChannelSubscribers(channel) {
    return this.subscriptions.get(channel) || new Set();
  }

  /**
   * Handle incoming messages
   * @param {string} userId - User ID
   * @param {string | Buffer | ArrayBuffer | Buffer[]} message - Message data
   */
  handleMessage(userId, message) {
    try {
      const data = JSON.parse(message.toString());

      switch (data.type) {
        case "ping":
          this.sendToUser(userId, { type: "pong" });
          break;
        case "subscribe":
          if (data.channel) {
            this.handleSubscription(userId, data.channel);
          }
          break;
        case "unsubscribe":
          if (data.channel) {
            this.handleUnsubscription(userId, data.channel);
          }
          break;
        default:
          logger.warn(`Unknown message type: ${data.type}`);
          this.sendToUser(userId, {
            type: "error",
            message: "Unknown message type",
          });
      }
    } catch (error) {
      logger.error("WebSocket message handling error:", error);
      this.sendToUser(userId, {
        type: "error",
        message: "Invalid message format",
      });
    }
  }

  /**
   * Send message to specific user
   * @param {string} userId - User ID
   * @param {object} data - Message data
   */
  sendToUser(userId, data) {
    const client = this.clients.get(userId);
    if (client?.readyState === WebSocket.OPEN) {
      try {
        client.send(JSON.stringify(data));
      } catch (error) {
        logger.error(`Error sending message to user ${userId}:`, error);
        this.handleDisconnect(userId);
      }
    }
  }

  /**
   * Send message to channel subscribers
   * @param {string} channel - Channel name
   * @param {object} data - Message data
   */
  sendToChannel(channel, data) {
    const subscribers = this.getChannelSubscribers(channel);
    subscribers.forEach((userId) => {
      this.sendToUser(userId, {
        type: "channel",
        channel,
        data,
      });
    });
  }

  /**
   * Send message to multiple users
   * @param {string[]} userIds - Array of user IDs
   * @param {object} data - Message data
   */
  sendToUsers(userIds, data) {
    userIds.forEach((userId) => {
      if (userId) this.sendToUser(userId, data);
    });
  }

  /**
   * Broadcast message to all connected clients
   * @param {object} data - Message data
   * @param {string} [excludeUserId] - Optional user ID to exclude from broadcast
   */
  broadcast(data, excludeUserId = "") {
    this.clients.forEach((client, userId) => {
      if (userId !== excludeUserId && client.readyState === WebSocket.OPEN) {
        try {
          client.send(JSON.stringify(data));
        } catch (error) {
          logger.error(`Error broadcasting to user ${userId}:`, error);
          this.handleDisconnect(userId);
        }
      }
    });
  }

  /**
   * Send notification to specific user
   * @param {string} userId - User ID
   * @param {object} notification - Notification data
   */
  sendNotification(userId, notification) {
    this.sendToUser(userId, {
      type: "notification",
      payload: notification,
    });
  }

  /**
   * Cleanup disconnected clients
   */
  cleanup() {
    this.clients.forEach((client, userId) => {
      if (
        client.readyState === WebSocket.CLOSED ||
        client.readyState === WebSocket.CLOSING
      ) {
        this.handleDisconnect(userId);
      }
    });
  }
}

export default WebSocketService;
