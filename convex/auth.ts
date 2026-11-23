import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

// Generate 6-digit OTP code
function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP via email (placeholder - will integrate with Resend)
async function sendOTPEmail(email: string, code: string) {
    // TODO: Integrate with Resend API
    console.log(`Sending OTP ${code} to ${email}`);
    // For now, just log it - we'll implement email sending later
}

// Request OTP for login/signup
export const requestOTP = mutation({
    args: {
        email: v.string(),
    },
    handler: async (ctx, args) => {
        const { email } = args;

        // Check if user exists
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", email))
            .first();

        // No account for this email: do not create a placeholder user and do not
        // send a code. Creating one here left a nameless row behind that made
        // checkEmail report the address as taken, which locked the person out of
        // signup while login still refused to advance.
        if (!existingUser) {
            return { success: false, isExistingUser: false };
        }

        // Generate OTP
        const otpCode = generateOTP();
        const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

        await ctx.db.patch(existingUser._id, {
            otpCode,
            otpExpiry,
            updatedAt: Date.now(),
        });

        // Send OTP email (Scheduled Action)
        await ctx.scheduler.runAfter(0, api.actions.sendOTPEmail, {
            email,
            code: otpCode
        });

        // Log for dev environment fallback
        console.log(`[OTP Generated] ${email}: ${otpCode}`);

        return { success: true, isExistingUser: true };
    },
});

// Verify OTP and authenticate
export const verifyOTP = mutation({
    args: {
        email: v.string(),
        code: v.string(),
    },
    handler: async (ctx, args) => {
        const { email, code } = args;

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", email))
            .first();

        if (!user) {
            throw new Error("User not found");
        }

        // Check if OTP is valid
        if (user.otpCode !== code) {
            throw new Error("Invalid OTP code");
        }

        if (!user.otpExpiry || user.otpExpiry < Date.now()) {
            throw new Error("OTP code has expired");
        }

        // Clear OTP and update last login
        await ctx.db.patch(user._id, {
            otpCode: undefined,
            otpExpiry: undefined,
            lastLoginAt: Date.now(),
            updatedAt: Date.now(),
        });

        return {
            userId: user._id,
            email: user.email,
            isNewUser: !user.firstName || !user.lastName,
        };
    },
});

// Complete signup with user details
export const completeSignup = mutation({
    args: {
        email: v.string(),
        firstName: v.string(),
        lastName: v.string(),
        businessName: v.string(),
        niche: v.string(),
        location: v.string(),
        legalStructure: v.string(),
        operationRange: v.array(v.string()),
        size: v.string(),
    },
    handler: async (ctx, args) => {
        const { email, ...userData } = args;

        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", email))
            .first();

        // Atomic Signup Check: If user exists and is NOT fresh, throw error
        if (existingUser) {
            if (!existingUser.isFreshSignup) {
                throw new Error("User already exists. Please login.");
            }
            // If fresh, we update the existing record (rare case if partial signup existed)
            await ctx.db.patch(existingUser._id, {
                ...userData,
                isFreshSignup: false,
                hasConnectedBank: false,
                completedRequirements: [],
                theme: "light",
                language: "English",
                agentName: "Ralph",
                agentPersonality: "Professional",
                agentModel: "Flash",
                billingAddress: userData.location,
                primaryAddress: userData.location,
                staffResidencies: [],
                seenGuides: [],
                updatedAt: Date.now(),
            });
            return { userId: existingUser._id };
        }

        // Create NEW user (Atomic)
        const newUserId = await ctx.db.insert("users", {
            email,
            ...userData,
            userType: "main",
            isFreshSignup: false,
            hasConnectedBank: false,
            completedRequirements: [],
            theme: "light",
            language: "English",
            agentName: "Ralph",
            agentPersonality: "Professional",
            agentModel: "Flash",
            billingAddress: userData.location,
            primaryAddress: userData.location,
            staffResidencies: [],
            seenGuides: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // Send Welcome Email
        await ctx.scheduler.runAfter(0, api.actions.sendWelcomeEmail, {
            email,
            name: userData.firstName
        });

        return { userId: newUserId };
    },
});

// Get current user by email
export const getUserByEmail = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();

        return user;
    },
});

// Get user by ID
export const getUserById = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.userId);
    },
});

// Update user data
export const updateUser = mutation({
    args: {
        userId: v.id("users"),
        updates: v.any(), // Flexible updates
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.userId, {
            ...args.updates,
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});

// Delete user account
export const deleteAccount = mutation({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        // 1. Delete user record
        await ctx.db.delete(args.userId);

        // 2. Cascade Delete: Delete all related data
        // Transactions
        const transactions = await ctx.db
            .query("transactions")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();
        for (const t of transactions) await ctx.db.delete(t._id);

        // Services
        const services = await ctx.db
            .query("services")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();
        for (const s of services) await ctx.db.delete(s._id);

        // Invoices
        const invoices = await ctx.db
            .query("invoices")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();
        for (const i of invoices) await ctx.db.delete(i._id);

        // Notifications
        const notifications = await ctx.db
            .query("notifications")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();
        for (const n of notifications) await ctx.db.delete(n._id);

        // Automations
        const automations = await ctx.db
            .query("automations")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();
        for (const a of automations) await ctx.db.delete(a._id);

        // Email Connections
        const emailConnections = await ctx.db
            .query("emailConnections")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();
        for (const e of emailConnections) await ctx.db.delete(e._id);

        // Discounts
        const discounts = await ctx.db
            .query("discounts")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();
        for (const d of discounts) await ctx.db.delete(d._id);


        return { success: true };
    },
});

// Check if email exists (used for real-time validation)
export const checkEmail = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();

        return { isExistingUser: !!user };
    },
});
