import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

// Generate 8-character AMSID
function generateAMSID(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Generate invitation token
function generateInvitationToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Get all staff members for a main user
export const getStaff = query({
    args: { mainUserId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_main_user", (q) => q.eq("mainUserId", args.mainUserId))
            .collect();
    },
});

// Invite a staff member
export const inviteStaffMember = mutation({
    args: {
        mainUserId: v.id("users"),
        email: v.string(),
        firstName: v.string(),
        lastName: v.string(),
        accessLevel: v.union(
            v.literal("Admin"),
            v.literal("Manager"),
            v.literal("Editor"),
            v.literal("Viewer"),
            v.literal("Investor")
        ),
        residency: v.optional(v.string()),
        salary: v.optional(v.number()),
        paymentFrequency: v.optional(v.string()),
        paymentDate: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { mainUserId, email, ...staffData } = args;

        // Check if user with this email already exists
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", email))
            .first();

        if (existingUser) {
            throw new Error("A user with this email already exists");
        }

        // Get main user info for invitation email
        const mainUser = await ctx.db.get(mainUserId);
        if (!mainUser) {
            throw new Error("Main user not found");
        }

        // Generate invitation token and AMSID
        const invitationToken = generateInvitationToken();
        const amsid = generateAMSID();

        // Create staff user with pending invitation
        const staffId = await ctx.db.insert("users", {
            email,
            ...staffData,
            userType: "staff",
            mainUserId,
            invitationStatus: "pending",
            invitationToken,
            invitedAt: Date.now(),
            amsid,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // Send invitation email
        await ctx.scheduler.runAfter(0, api.actions.sendInvitationEmail, {
            email,
            inviterName: `${mainUser.firstName} ${mainUser.lastName}`,
            token: invitationToken
        });

        return { staffId, invitationToken };
    },
});

// Accept staff invitation
export const acceptInvitation = mutation({
    args: {
        invitationToken: v.string(),
        otpCode: v.string(),
    },
    handler: async (ctx, args) => {
        const staff = await ctx.db
            .query("users")
            .withIndex("by_invitation_token", (q) => q.eq("invitationToken", args.invitationToken))
            .first();

        if (!staff) {
            throw new Error("Invalid invitation token");
        }

        if (staff.invitationStatus !== "pending") {
            throw new Error("Invitation already processed");
        }

        // Verify OTP (assuming OTP was sent when they tried to accept)
        if (staff.otpCode !== args.otpCode) {
            throw new Error("Invalid OTP code");
        }

        if (!staff.otpExpiry || staff.otpExpiry < Date.now()) {
            throw new Error("OTP code has expired");
        }

        // Accept invitation
        await ctx.db.patch(staff._id, {
            invitationStatus: "accepted",
            joinedDate: new Date().toISOString(),
            invitationToken: undefined,
            otpCode: undefined,
            otpExpiry: undefined,
            lastLoginAt: Date.now(),
            updatedAt: Date.now(),
        });

        return { userId: staff._id, email: staff.email };
    },
});

// Validate invitation token
export const validateInvitation = query({
    args: { token: v.string() },
    handler: async (ctx, args) => {
        const staff = await ctx.db
            .query("users")
            .withIndex("by_invitation_token", (q) => q.eq("invitationToken", args.token))
            .first();

        if (!staff || staff.invitationStatus !== "pending") {
            return { valid: false };
        }

        const mainUser = await ctx.db.get(staff.mainUserId!);

        return {
            valid: true,
            email: staff.email,
            businessName: mainUser?.businessName,
            inviterName: mainUser ? `${mainUser.firstName} ${mainUser.lastName}` : "Admin",
            role: staff.accessLevel
        };
    },
});

// Complete staff signup (instead of acceptInvitation with OTP)
export const completeStaffSignup = mutation({
    args: {
        token: v.string(),
        firstName: v.string(),
        lastName: v.string(),
    },
    handler: async (ctx, args) => {
        const staff = await ctx.db
            .query("users")
            .withIndex("by_invitation_token", (q) => q.eq("invitationToken", args.token))
            .first();

        if (!staff || staff.invitationStatus !== "pending") {
            throw new Error("Invalid or expired invitation");
        }

        // Activate the staff account
        await ctx.db.patch(staff._id, {
            firstName: args.firstName,
            lastName: args.lastName,
            invitationStatus: "accepted",
            invitationToken: undefined, // Clear token so it can't be used again
            joinedDate: new Date().toISOString(),
            lastLoginAt: Date.now(),
            updatedAt: Date.now(),
            // Ensure they are marked as not fresh if that logic applies, or keep them fresh to see onboarding?
            // Usually staff don't need the full business setup wizard, so maybe:
            isFreshSignup: false
        });

        return { userId: staff._id, email: staff.email };
    },
});

// Update staff member
export const updateStaffMember = mutation({
    args: {
        staffId: v.id("users"),
        updates: v.any(),
    },
    handler: async (ctx, args) => {
        const staff = await ctx.db.get(args.staffId);

        if (!staff || staff.userType !== "staff") {
            throw new Error("Staff member not found");
        }

        await ctx.db.patch(args.staffId, {
            ...args.updates,
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});

// Delete staff member (and their account)
export const deleteStaffMember = mutation({
    args: {
        staffId: v.id("users"),
        mainUserId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const staff = await ctx.db.get(args.staffId);

        if (!staff || staff.userType !== "staff") {
            throw new Error("Staff member not found");
        }

        // Verify the main user is deleting their own staff
        if (staff.mainUserId !== args.mainUserId) {
            throw new Error("Unauthorized: You can only delete your own staff members");
        }

        // Delete the staff user account
        await ctx.db.delete(args.staffId);

        return { success: true };
    },
});

// Add direct staff member (for Viewer role - no invitation needed)
export const addStaffMemberDirect = mutation({
    args: {
        mainUserId: v.id("users"),
        email: v.string(),
        firstName: v.string(),
        lastName: v.string(),
        residency: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { mainUserId, email, ...staffData } = args;

        // Check if user with this email already exists
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", email))
            .first();

        if (existingUser) {
            throw new Error("A user with this email already exists");
        }

        const amsid = generateAMSID();

        // Create staff user directly (Viewer role doesn't need invitation)
        const staffId = await ctx.db.insert("users", {
            email,
            ...staffData,
            userType: "staff",
            mainUserId,
            accessLevel: "Viewer",
            invitationStatus: "accepted",
            joinedDate: new Date().toISOString(),
            amsid,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return { staffId };
    },
});
