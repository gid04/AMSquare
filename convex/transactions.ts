import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getTransactions = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("transactions")
            .withIndex("by_user_and_date", (q) => q.eq("userId", args.userId))
            .order("desc")
            .collect();
    },
});

export const createTransaction = mutation({
    args: {
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
    },
    handler: async (ctx, args) => {
        const transactionId = await ctx.db.insert("transactions", {
            ...args,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
        return transactionId;
    },
});

export const deleteTransaction = mutation({
    args: {
        transactionId: v.id("transactions"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const tx = await ctx.db.get(args.transactionId);
        if (!tx || tx.userId !== args.userId) {
            throw new Error("Transaction not found or unauthorized");
        }
        await ctx.db.delete(args.transactionId);
        return { success: true };
    },
});
