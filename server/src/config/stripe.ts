// server/src/config/stripe.ts
import Stripe from "stripe";

// Validate required environment variables
const validateStripeConfig = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("STRIPE_SECRET_KEY is required but not provided");
    throw new Error("Missing STRIPE_SECRET_KEY environment variable");
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.warn("STRIPE_WEBHOOK_SECRET not provided - webhooks will not work");
  }
};

// Initialize Stripe with proper error handling
let stripe;
try {
  validateStripeConfig();
  // Fix 1: Ensure STRIPE_SECRET_KEY is not undefined
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is required");
  }
  
  stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2025-07-30.basil",
  });
} catch (error) {
  console.error("Failed to initialize Stripe:", error.message);
  // Create a mock stripe instance for development
  stripe = {
    paymentIntents: {
      create: async () => ({ id: "mock_pi", client_secret: "mock_secret" }),
      retrieve: async () => ({ id: "mock_pi", status: "succeeded" }),
    },
    checkout: {
      sessions: {
        create: async () => ({ id: "mock_session", url: "mock_url" }),
      },
    },
    refunds: { create: async () => ({ id: "mock_refund" }) },
    customers: {
      create: async () => ({ id: "mock_customer" }),
      list: async () => ({ data: [] }),
    },
    paymentMethods: {
      list: async () => ({ data: [] }),
    },
    webhooks: {
      constructEvent: () => ({ type: "mock_event" }),
    },
  };
}

interface StripeConfig {
  paymentMethods: string[];
  currency: string;
  webhooks: {
    secret: string | undefined;
    endpoints: string[];
  };
}

const STRIPE_CONFIG: StripeConfig = {
  paymentMethods: ["card"],
  currency: "usd",
  webhooks: {
    secret: process.env.STRIPE_WEBHOOK_SECRET,
    endpoints: [
      "payment_intent.succeeded",
      "payment_intent.payment_failed",
      "checkout.session.completed",
      "invoice.payment_succeeded",
    ],
  },
};

/**
 * Create a payment intent
 * @param options - Payment intent options
 * @returns Promise<Object> Stripe payment intent
 */
const createPaymentIntent = async ({
  amount,
  currency = "usd",
  description,
  metadata = {},
}: {
  amount: number;
  currency?: string;
  description?: string;
  metadata?: Record<string, any>;
}) => {
  try {
    if (!amount || amount <= 0) {
      throw new Error("Invalid amount provided");
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Ensure integer
      currency: currency.toLowerCase(),
      description: description || "School fee payment",
      metadata: {
        ...metadata,
        created_by: "school_management_system",
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      success: true,
      data: paymentIntent,
      clientSecret: paymentIntent.client_secret,
    };
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Create a checkout session
 * @param options - Checkout session options
 * @returns Promise<Object> Stripe checkout session
 */
const createCheckoutSession = async ({
  amount,
  currency = "usd",
  studentId,
  feeId,
  successUrl,
  cancelUrl,
  description,
}: {
  amount: number;
  currency?: string;
  studentId?: string;
  feeId?: string;
  successUrl: string;
  cancelUrl: string;
  description?: string;
}) => {
  try {
    if (!amount || amount <= 0) {
      throw new Error("Invalid amount provided");
    }

    if (!successUrl || !cancelUrl) {
      throw new Error("Success URL and Cancel URL are required");
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: description || "School Fee Payment",
              description: `Payment for student ${studentId}`,
            },
            unit_amount: Math.round(amount), // Amount in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        studentId: studentId || "",
        feeId: feeId || "",
        created_by: "school_management_system",
      },
      client_reference_id: `student_${studentId}_fee_${feeId}`,
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    return {
      success: true,
      data: session,
      sessionId: session.id,
      url: session.url,
    };
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Process a refund
 * @param options - Refund options
 * @returns Promise<Object> Refund result
 */
const processRefund = async ({
  paymentIntentId,
  amount,
  reason = "requested_by_customer",
}: {
  paymentIntentId: string;
  amount?: number;
  reason?: "duplicate" | "fraudulent" | "requested_by_customer";
}) => {
  try {
    if (!paymentIntentId) {
      throw new Error("Payment intent ID is required");
    }

    // Validate reason against allowed values
    const validReasons = ["duplicate", "fraudulent", "requested_by_customer"];
    const refundReason = validReasons.includes(reason)
      ? reason
      : "requested_by_customer";

    // Properly typed refund parameters
    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
      reason: refundReason as "duplicate" | "fraudulent" | "requested_by_customer",
      ...(amount && { amount: Math.round(amount) }), // Add amount if provided
    };

    const refund = await stripe.refunds.create(refundParams);

    return {
      success: true,
      data: refund,
      refundId: refund.id,
      amount: refund.amount,
      status: refund.status,
    };
  } catch (error) {
    console.error("Error processing refund:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Retrieve payment intent
 * @param paymentIntentId - Payment intent ID
 * @returns Promise<Object> Payment intent
 */
const getPaymentIntent = async (paymentIntentId: string) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return {
      success: true,
      data: paymentIntent,
    };
  } catch (error) {
    console.error("Error retrieving payment intent:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Handle Stripe webhooks
 * @param rawBody - Raw request body
 * @param signature - Stripe signature header
 * @returns Webhook event or error
 */
const handleWebhook = (rawBody: string, signature: string) => {
  try {
    if (!STRIPE_CONFIG.webhooks.secret) {
      console.warn(
        "Webhook secret not configured - skipping signature verification"
      );
      return { success: false, error: "Webhook secret not configured" };
    }

    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      STRIPE_CONFIG.webhooks.secret
    );

    return {
      success: true,
      event,
    };
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get customer payment methods
 * @param customerId - Stripe customer ID
 * @returns Promise<Object> Payment methods
 */
const getCustomerPaymentMethods = async (customerId: string) => {
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    });

    return {
      success: true,
      data: paymentMethods.data,
    };
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Create or retrieve Stripe customer
 * @param customerData - Customer data
 * @returns Promise<Object> Stripe customer
 */
const createOrGetCustomer = async ({ 
  email, 
  name, 
  metadata = {} 
}: {
  email: string;
  name: string;
  metadata?: Record<string, any>;
}) => {
  try {
    // First, try to find existing customer by email
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      return {
        success: true,
        data: existingCustomers.data[0],
        isNew: false,
      };
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        ...metadata,
        created_by: "school_management_system",
      },
    });

    return {
      success: true,
      data: customer,
      isNew: true,
    };
  } catch (error) {
    console.error("Error creating/retrieving customer:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Utility functions - Must be declared before being used in exports
export const formatAmount = (amount: number): number => Math.round(amount * 100); // Convert dollars to cents

export const formatCurrency = (amount: number, currency = "USD"): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100); // Convert cents to dollars
};

export {
  stripe,
  STRIPE_CONFIG,
  createPaymentIntent,
  createCheckoutSession,
  processRefund,
  getPaymentIntent,
  handleWebhook,
  getCustomerPaymentMethods,
  createOrGetCustomer,
};

// Default export for CommonJS compatibility
export default {
  stripe,
  STRIPE_CONFIG,
  createPaymentIntent,
  createCheckoutSession,
  processRefund,
  getPaymentIntent,
  handleWebhook,
  getCustomerPaymentMethods,
  createOrGetCustomer,
  formatAmount,
  formatCurrency,
};