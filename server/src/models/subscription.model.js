// @ts-nocheck

// server/src/models/subscription.model.js - PostgreSQL Subscription Model
import { query } from "../config/database";
import withTransaction from "../config/database";

/**
 * PostgreSQL Subscription Model
 * For managing school subscriptions and plans
 */
class Subscription {
  /**
   * Find subscription by ID
   * @param {string} id - Subscription ID
   * @returns {Object|null} Subscription object or null
   */
  static async findById(id) {
    const result = await query(
      `
      SELECT s.*, u.first_name || ' ' || u.last_name as subscriber_name,
             u.email as subscriber_email
      FROM subscriptions s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.id = $1
    `,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Create new subscription
   * @param {Object} subscriptionData - Subscription data
   * @returns {Object} Created subscription
   */
  static async create(subscriptionData) {
    const {
      userId,
      planType = "basic",
      status = "active",
      startDate = new Date(),
      endDate,
      price,
      currency = "USD",
      billingCycle = "monthly",
      features = [],
      metadata = {},
    } = subscriptionData;

    const result = await query(
      `
      INSERT INTO subscriptions (
        user_id, plan_type, status, start_date, end_date, price,
        currency, billing_cycle, features, metadata,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *
    `,
      [
        userId,
        planType,
        status,
        startDate,
        endDate,
        price,
        currency,
        billingCycle,
        JSON.stringify(features),
        JSON.stringify(metadata),
      ]
    );

    return result.rows[0];
  }

  /**
   * Update subscription by ID
   * @param {string} id - Subscription ID
   * @param {Object} updateData - Data to update
   * @returns {Object|null} Updated subscription
   */
  static async findByIdAndUpdate(id, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach((key) => {
      const dbField = this.camelToSnake(key);
      if (key === "features" || key === "metadata") {
        fields.push(`${dbField} = $${paramCount}`);
        values.push(JSON.stringify(updateData[key]));
      } else {
        fields.push(`${dbField} = $${paramCount}`);
        values.push(updateData[key]);
      }
      paramCount++;
    });

    if (fields.length === 0) return null;

    values.push(id);
    const result = await query(
      `
      UPDATE subscriptions 
      SET ${fields.join(", ")}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `,
      values
    );

    return result.rows[0] || null;
  }

  /**
   * Delete subscription by ID
   * @param {string} id - Subscription ID
   * @returns {boolean} Success status
   */
  static async findByIdAndDelete(id) {
    const result = await query(
      "DELETE FROM subscriptions WHERE id = $1 RETURNING id",
      [id]
    );
    return result.rowCount > 0;
  }

  /**
   * Find subscription by user
   * @param {string} userId - User ID
   * @returns {Object|null} Active subscription or null
   */
  static async findByUser(userId) {
    const result = await query(
      `
      SELECT * FROM subscriptions 
      WHERE user_id = $1 AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 1
    `,
      [userId]
    );
    return result.rows[0] || null;
  }

  /**
   * Find all subscriptions with pagination
   * @param {Object} options - Query options
   * @returns {Object} Subscriptions with pagination info
   */
  static async findAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      status = null,
      planType = null,
      billingCycle = null,
      search = null,
      sortBy = "created_at",
      sortOrder = "DESC",
    } = options;

    const offset = (page - 1) * limit;
    let whereClause = "WHERE 1=1";
    const params = [];
    let paramCount = 1;

    if (status) {
      whereClause += ` AND s.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (planType) {
      whereClause += ` AND s.plan_type = $${paramCount}`;
      params.push(planType);
      paramCount++;
    }

    if (billingCycle) {
      whereClause += ` AND s.billing_cycle = $${paramCount}`;
      params.push(billingCycle);
      paramCount++;
    }

    if (search) {
      whereClause += ` AND (
        u.first_name ILIKE $${paramCount} OR 
        u.last_name ILIKE $${paramCount} OR 
        u.email ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }

    // Get total count
    const countResult = await query(
      `
      SELECT COUNT(*) as total
      FROM subscriptions s
      LEFT JOIN users u ON s.user_id = u.id
      ${whereClause}
    `,
      params
    );

    const total = parseInt(countResult.rows[0].total);

    // Get subscriptions
    params.push(limit, offset);
    const validSortColumns = [
      "created_at",
      "start_date",
      "end_date",
      "price",
      "status",
    ];
    const orderBy = validSortColumns.includes(sortBy) ? sortBy : "created_at";
    const order = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const result = await query(
      `
      SELECT s.*, u.first_name || ' ' || u.last_name as subscriber_name,
             u.email as subscriber_email, u.username as subscriber_username
      FROM subscriptions s
      LEFT JOIN users u ON s.user_id = u.id
      ${whereClause}
      ORDER BY s.${orderBy} ${order}
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `,
      params
    );

    return {
      subscriptions: result.rows,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: result.rowCount,
        totalRecords: total,
      },
    };
  }

  /**
   * Get subscription statistics
   * @returns {Object} Subscription statistics
   */
  static async getStatistics() {
    const result = await query(`
      SELECT 
        COUNT(*) as total_subscriptions,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_subscriptions,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_subscriptions,
        COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_subscriptions,
        COUNT(CASE WHEN plan_type = 'basic' THEN 1 END) as basic_plans,
        COUNT(CASE WHEN plan_type = 'premium' THEN 1 END) as premium_plans,
        COUNT(CASE WHEN plan_type = 'enterprise' THEN 1 END) as enterprise_plans,
        SUM(CASE WHEN status = 'active' THEN price ELSE 0 END) as active_revenue,
        AVG(price) as average_price,
        COUNT(CASE WHEN end_date < CURRENT_DATE AND status = 'active' THEN 1 END) as expiring_soon
      FROM subscriptions
    `);

    const stats = result.rows[0];
    return {
      totalSubscriptions: parseInt(stats.total_subscriptions),
      activeSubscriptions: parseInt(stats.active_subscriptions),
      cancelledSubscriptions: parseInt(stats.cancelled_subscriptions),
      expiredSubscriptions: parseInt(stats.expired_subscriptions),
      planDistribution: {
        basic: parseInt(stats.basic_plans),
        premium: parseInt(stats.premium_plans),
        enterprise: parseInt(stats.enterprise_plans),
      },
      activeRevenue: parseFloat(stats.active_revenue || 0),
      averagePrice: parseFloat(stats.average_price || 0),
      expiringSoon: parseInt(stats.expiring_soon),
    };
  }

  /**
   * Get expiring subscriptions
   * @param {number} days - Days until expiration
   * @returns {Array} Array of expiring subscriptions
   */
  static async getExpiringSubscriptions(days = 7) {
    const result = await query(`
      SELECT s.*, u.first_name || ' ' || u.last_name as subscriber_name,
             u.email as subscriber_email
      FROM subscriptions s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.status = 'active' 
        AND s.end_date <= CURRENT_DATE + INTERVAL '${days} days'
        AND s.end_date > CURRENT_DATE
      ORDER BY s.end_date ASC
    `);

    return result.rows;
  }

  /**
   * Cancel subscription
   * @param {string} subscriptionId - Subscription ID
   * @param {string} reason - Cancellation reason
   * @returns {Object} Updated subscription
   */
  static async cancel(subscriptionId, reason = null) {
    return withTransaction(async (client) => {
      const result = await client.query(
        `
        UPDATE subscriptions 
        SET status = 'cancelled', 
            metadata = jsonb_set(
              COALESCE(metadata, '{}'), 
              '{cancellation_reason}', 
              $2,
              true
            ),
            updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
        [subscriptionId, JSON.stringify(reason)]
      );

      return result.rows[0];
    });
  }

  /**
   * Renew subscription
   * @param {string} subscriptionId - Subscription ID
   * @param {Object} renewalData - Renewal data
   * @returns {Object} Updated subscription
   */
  static async renew(subscriptionId, renewalData) {
    const { endDate, price } = renewalData;

    return withTransaction(async (client) => {
      const result = await client.query(
        `
        UPDATE subscriptions 
        SET status = 'active',
            end_date = $2,
            price = COALESCE($3, price),
            metadata = jsonb_set(
              COALESCE(metadata, '{}'), 
              '{last_renewed}', 
              $4,
              true
            ),
            updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
        [subscriptionId, endDate, price, JSON.stringify(new Date())]
      );

      return result.rows[0];
    });
  }

  /**
   * Upgrade subscription
   * @param {string} subscriptionId - Subscription ID
   * @param {Object} upgradeData - Upgrade data
   * @returns {Object} Updated subscription
   */
  static async upgrade(subscriptionId, upgradeData) {
    const { planType, price, features } = upgradeData;

    return withTransaction(async (client) => {
      const result = await client.query(
        `
        UPDATE subscriptions 
        SET plan_type = $2,
            price = $3,
            features = $4,
            metadata = jsonb_set(
              COALESCE(metadata, '{}'), 
              '{last_upgraded}', 
              $5,
              true
            ),
            updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
        [
          subscriptionId,
          planType,
          price,
          JSON.stringify(features),
          JSON.stringify(new Date()),
        ]
      );

      return result.rows[0];
    });
  }

  /**
   * Check if user has feature access
   * @param {string} userId - User ID
   * @param {string} feature - Feature to check
   * @returns {boolean} Feature access status
   */
  static async hasFeatureAccess(userId, feature) {
    const result = await query(
      `
      SELECT features FROM subscriptions 
      WHERE user_id = $1 AND status = 'active' AND end_date > CURRENT_DATE
      ORDER BY created_at DESC
      LIMIT 1
    `,
      [userId]
    );

    if (result.rows.length === 0) return false;

    const features = result.rows[0].features || [];
    return features.includes(feature);
  }

  /**
   * Get user's current plan
   * @param {string} userId - User ID
   * @returns {Object|null} Current plan details
   */
  static async getCurrentPlan(userId) {
    const result = await query(
      `
      SELECT plan_type, features, status, end_date
      FROM subscriptions 
      WHERE user_id = $1 AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 1
    `,
      [userId]
    );

    return result.rows[0] || null;
  }

  /**
   * Process subscription payment
   * @param {string} subscriptionId - Subscription ID
   * @param {Object} paymentData - Payment data
   * @returns {Object} Updated subscription
   */
  static async processPayment(subscriptionId, paymentData) {
    const { transactionId, amount, paymentMethod } = paymentData;

    return withTransaction(async (client) => {
      // Update subscription
      const result = await client.query(
        `
        UPDATE subscriptions 
        SET metadata = jsonb_set(
              COALESCE(metadata, '{}'), 
              '{last_payment}', 
              $2,
              true
            ),
            updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
        [
          subscriptionId,
          JSON.stringify({
            transactionId,
            amount,
            paymentMethod,
            paidAt: new Date(),
          }),
        ]
      );

      return result.rows[0];
    });
  }

  /**
   * Get subscription history for user
   * @param {string} userId - User ID
   * @returns {Array} Array of subscription history
   */
  static async getUserHistory(userId) {
    const result = await query(
      `
      SELECT * FROM subscriptions 
      WHERE user_id = $1
      ORDER BY created_at DESC
    `,
      [userId]
    );

    return result.rows;
  }

  /**
   * Convert camelCase to snake_case
   * @param {string} str - String to convert
   * @returns {string} Converted string
   */
  static camelToSnake(str) {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }

  /**
   * Format subscription object for API response
   * @param {Object} subscription - Raw subscription object from database
   * @returns {Object} Formatted subscription object
   */
  static formatSubscription(subscription) {
    if (!subscription) return null;

    return {
      id: subscription.id,
      userId: subscription.user_id,
      subscriberName: subscription.subscriber_name,
      subscriberEmail: subscription.subscriber_email,
      subscriberUsername: subscription.subscriber_username,
      planType: subscription.plan_type,
      status: subscription.status,
      startDate: subscription.start_date,
      endDate: subscription.end_date,
      price: parseFloat(subscription.price),
      currency: subscription.currency,
      billingCycle: subscription.billing_cycle,
      features: subscription.features || [],
      metadata: subscription.metadata || {},
      isActive:
        subscription.status === "active" &&
        new Date(subscription.end_date) > new Date(),
      daysRemaining: subscription.end_date
        ? Math.max(
            0,
            Math.ceil(
              (new Date(subscription.end_date) - new Date()) /
                (1000 * 60 * 60 * 24)
            )
          )
        : null,
      createdAt: subscription.created_at,
      updatedAt: subscription.updated_at,
    };
  }
}

export default Subscription;
