import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all services for a user
export const getServices = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("services")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();
    },
});

// Create a new service/product
export const createService = mutation({
    args: {
        userId: v.id("users"),
        type: v.union(v.literal("Service"), v.literal("Product")),
        name: v.string(),
        description: v.string(),
        price: v.optional(v.number()),
        frequency: v.optional(v.string()),
        status: v.union(v.literal("Active"), v.literal("Archived"), v.literal("Draft")),
        plans: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const { userId, ...serviceData } = args;

        const serviceId = await ctx.db.insert("services", {
            userId,
            ...serviceData,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return serviceId;
    },
});

// Update a service/product
export const updateService = mutation({
    args: {
        serviceId: v.id("services"),
        updates: v.any(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.serviceId, {
            ...args.updates,
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});

// Delete a service/product
export const deleteService = mutation({
    args: { serviceId: v.id("services") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.serviceId);
        return { success: true };
    },
});

// Get all discounts for a user
export const getDiscounts = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("discounts")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();
    },
});

// Create a discount code
export const createDiscount = mutation({
    args: {
        userId: v.id("users"),
        serviceId: v.optional(v.id("services")),
        name: v.string(),
        code: v.string(),
        value: v.number(),
        type: v.union(v.literal("Percentage"), v.literal("Fixed")),
        status: v.union(v.literal("Active"), v.literal("Expired")),
    },
    handler: async (ctx, args) => {
        const { userId, ...discountData } = args;

        const discountId = await ctx.db.insert("discounts", {
            userId,
            ...discountData,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return discountId;
    },
});

// Delete a discount
export const deleteDiscount = mutation({
    args: { discountId: v.id("discounts") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.discountId);
        return { success: true };
    },
});
