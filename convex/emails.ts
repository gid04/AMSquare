import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get email connection for a user
export const getEmailConnection = query({
    args: {
        userId: v.id("users"),
        provider: v.union(v.literal("gmail"), v.literal("outlook")),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("emailConnections")
            .withIndex("by_user_and_provider", (q) =>
                q.eq("userId", args.userId).eq("provider", args.provider)
            )
            .first();
    },
});

// Save email connection (OAuth tokens)
export const saveEmailConnection = mutation({
    args: {
        userId: v.id("users"),
        provider: v.union(v.literal("gmail"), v.literal("outlook")),
        email: v.string(),
        accessToken: v.string(),
        refreshToken: v.optional(v.string()),
        tokenExpiry: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const { userId, provider, ...connectionData } = args;

        // Check if connection already exists
        const existing = await ctx.db
            .query("emailConnections")
            .withIndex("by_user_and_provider", (q) =>
                q.eq("userId", userId).eq("provider", provider)
            )
            .first();

        if (existing) {
            // Update existing connection
            await ctx.db.patch(existing._id, {
                ...connectionData,
                isActive: true,
                lastSyncedAt: Date.now(),
                updatedAt: Date.now(),
            });
            return { connectionId: existing._id };
        } else {
            // Create new connection
            const connectionId = await ctx.db.insert("emailConnections", {
                userId,
                provider,
                ...connectionData,
                isActive: true,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
            return { connectionId };
        }
    },
});

// Disconnect email
export const disconnectEmail = mutation({
    args: {
        connectionId: v.id("emailConnections"),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.connectionId, {
            isActive: false,
            updatedAt: Date.now(),
        });
        return { success: true };
    },
});
