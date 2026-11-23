import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all invoices for a user
export const getInvoices = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("invoices")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .order("desc")
            .collect();
    },
});

// Create a new invoice
export const createInvoice = mutation({
    args: {
        userId: v.id("users"),
        invoiceNumber: v.string(),
        title: v.string(),
        description: v.string(),
        clientName: v.string(),
        clientEmail: v.string(),
        serviceName: v.string(),
        serviceId: v.optional(v.id("services")),
        quantity: v.number(),
        unitPrice: v.number(),
        billingFrequency: v.string(),
        amount: v.number(),
        dueDate: v.string(),
        paymentLink: v.string(),
        status: v.union(v.literal("Draft"), v.literal("Sent"), v.literal("Paid")),
    },
    handler: async (ctx, args) => {
        const { userId, ...invoiceData } = args;

        const invoiceId = await ctx.db.insert("invoices", {
            userId,
            ...invoiceData,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return invoiceId;
    },
});

// Update invoice status (e.g., mark as sent or paid)
export const updateInvoice = mutation({
    args: {
        invoiceId: v.id("invoices"),
        updates: v.any(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.invoiceId, {
            ...args.updates,
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});

// Mark invoice as sent via email
export const markInvoiceSent = mutation({
    args: {
        invoiceId: v.id("invoices"),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.invoiceId, {
            status: "Sent",
            sentViaEmail: true,
            sentAt: Date.now(),
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});
