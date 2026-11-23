import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table - main account holders and staff members
  users: defineTable({
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),

    // Business information (for main users)
    businessName: v.optional(v.string()),
    niche: v.optional(v.string()),
    location: v.optional(v.string()),
    legalStructure: v.optional(v.string()),
    operationRange: v.optional(v.array(v.string())),
    size: v.optional(v.string()),

    // User type and relationships
    userType: v.union(v.literal("main"), v.literal("staff")),
    mainUserId: v.optional(v.id("users")), // For staff members, points to main user

    // Staff-specific fields
    accessLevel: v.optional(v.union(
      v.literal("Admin"),
      v.literal("Manager"),
      v.literal("Editor"),
      v.literal("Viewer"),
      v.literal("Investor")
    )),
    invitationStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected")
    )),
    invitationToken: v.optional(v.string()),
    invitedAt: v.optional(v.number()),
    joinedDate: v.optional(v.string()),
    residency: v.optional(v.string()),

    // Compensation (for staff)
    salary: v.optional(v.number()),
    paymentFrequency: v.optional(v.string()),
    paymentDate: v.optional(v.string()),
    amsid: v.optional(v.string()),

    // Settings and preferences
    theme: v.optional(v.union(v.literal("light"), v.literal("dark"))),
    language: v.optional(v.string()),
    agentName: v.optional(v.string()),
    agentPersonality: v.optional(v.string()),
    agentModel: v.optional(v.string()),
    billingAddress: v.optional(v.string()),
    primaryAddress: v.optional(v.string()),
    staffResidencies: v.optional(v.array(v.string())),
    seenGuides: v.optional(v.array(v.string())),

    // Onboarding state
    isFreshSignup: v.optional(v.boolean()),
    hasConnectedBank: v.optional(v.boolean()),
    completedRequirements: v.optional(v.array(v.string())),

    // Funding details
    funding: v.optional(v.object({
      round: v.string(),
      amount: v.number(),
      date: v.string(),
      source: v.string(),
      investorCount: v.number(),
    })),

    // Authentication
    otpCode: v.optional(v.string()),
    otpExpiry: v.optional(v.number()),
    lastLoginAt: v.optional(v.number()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_main_user", ["mainUserId"])
    .index("by_invitation_token", ["invitationToken"]),

  // Products and Services
  services: defineTable({
    userId: v.id("users"), // Owner of this product/service
    type: v.union(v.literal("Service"), v.literal("Product")),
    name: v.string(),
    description: v.string(),
    price: v.optional(v.number()),
    frequency: v.optional(v.string()),
    status: v.union(v.literal("Active"), v.literal("Archived"), v.literal("Draft")),

    // Plans for products
    plans: v.optional(v.array(v.object({
      id: v.string(),
      name: v.string(),
      price: v.number(),
      billingPeriod: v.string(),
      paymentMethods: v.array(v.string()),
      supportedCountries: v.array(v.string()),
      platforms: v.array(v.string()),
    }))),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_status", ["userId", "status"]),

  // Discount codes
  discounts: defineTable({
    userId: v.id("users"),
    serviceId: v.optional(v.id("services")), // Optional: link to specific product
    name: v.string(),
    code: v.string(),
    value: v.number(),
    type: v.union(v.literal("Percentage"), v.literal("Fixed")),
    status: v.union(v.literal("Active"), v.literal("Expired")),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_service", ["serviceId"])
    .index("by_code", ["code"]),

  // Invoices
  invoices: defineTable({
    userId: v.id("users"),
    invoiceNumber: v.string(),
    title: v.string(),
    description: v.string(),

    // Client information
    clientName: v.string(),
    clientEmail: v.string(),

    // Service/product details
    serviceName: v.string(),
    serviceId: v.optional(v.id("services")),
    quantity: v.number(),
    unitPrice: v.number(),
    billingFrequency: v.string(),
    amount: v.number(),

    // Payment details
    dueDate: v.string(),
    paymentLink: v.string(),
    status: v.union(v.literal("Draft"), v.literal("Sent"), v.literal("Paid")),

    // Email tracking
    sentViaEmail: v.optional(v.boolean()),
    sentAt: v.optional(v.number()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_user_and_status", ["userId", "status"]),

  // Email connections (Gmail/Outlook)
  emailConnections: defineTable({
    userId: v.id("users"),
    provider: v.union(v.literal("gmail"), v.literal("outlook")),
    email: v.string(),

    // OAuth tokens (encrypted in production)
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    tokenExpiry: v.optional(v.number()),

    // Connection status
    isActive: v.boolean(),
    lastSyncedAt: v.optional(v.number()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_provider", ["userId", "provider"]),

  // Transactions
  transactions: defineTable({
    userId: v.id("users"),
    date: v.string(),
    description: v.string(),
    category: v.string(),
    amount: v.number(),
    status: v.string(),
    type: v.union(v.literal("debit"), v.literal("credit")),
    isRecurring: v.optional(v.boolean()),
    merchant: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),
    notes: v.optional(v.string()),
    serviceId: v.optional(v.id("services")),
    location: v.optional(v.string()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "date"]),

  // Notifications
  notifications: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.string(),
    type: v.string(),
    time: v.string(),
    read: v.boolean(),
    actionLabel: v.optional(v.string()),

    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_read", ["userId", "read"]),

  // Automation Rules
  automations: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.string(),
    type: v.string(), // e.g., "Treasury", "Tax", "Invoicing"
    isActive: v.boolean(),
    config: v.any(), // Flexible configuration object

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"]),
});
