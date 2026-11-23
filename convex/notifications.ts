import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get notifications for a user
export const getNotifications = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("notifications")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .order("desc")
            .collect();
    },
});

// Create a new notification
export const createNotification = mutation({
    args: {
        userId: v.id("users"),
        title: v.string(),
        description: v.string(),
        type: v.string(), // 'alert', 'info', 'agent', 'approval', 'success'
        actionLabel: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { userId, ...notifData } = args;
        const notificationId = await ctx.db.insert("notifications", {
            userId,
            ...notifData,
            time: "Just now", // In a real app, you'd calculate this or use a timestamp
            read: false,
            createdAt: Date.now(),
        });
        return notificationId;
    },
});

// Mark notification as read
export const markAsRead = mutation({
    args: { notificationId: v.id("notifications") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.notificationId, { read: true });
    },
});

// Mark all as read
export const markAllAsRead = mutation({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const unread = await ctx.db
            .query("notifications")
            .withIndex("by_user_and_read", (q) => q.eq("userId", args.userId).eq("read", false))
            .collect();

        for (const notif of unread) {
            await ctx.db.patch(notif._id, { read: true });
        }
    },
});
