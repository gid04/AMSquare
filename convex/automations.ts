import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getAutomations = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("automations")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();
    },
});

export const createAutomation = mutation({
    args: {
        userId: v.id("users"),
        name: v.string(),
        description: v.string(),
        type: v.string(),
        isActive: v.boolean(),
        config: v.any(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("automations", {
            ...args,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
});

export const updateAutomation = mutation({
    args: {
        automationId: v.id("automations"),
        userId: v.id("users"),
        updates: v.any(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db.get(args.automationId);
        if (!existing || existing.userId !== args.userId) {
            throw new Error("Automation not found or unauthorized");
        }
        await ctx.db.patch(args.automationId, {
            ...args.updates,
            updatedAt: Date.now(),
        });
        return { success: true };
    },
});

export const deleteAutomation = mutation({
    args: {
        automationId: v.id("automations"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db.get(args.automationId);
        if (!existing || existing.userId !== args.userId) {
            throw new Error("Automation not found or unauthorized");
        }
        await ctx.db.delete(args.automationId);
        return { success: true };
    },
});
