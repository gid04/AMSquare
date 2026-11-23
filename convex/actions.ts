import { action } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";

export const sendOTPEmail = action({
    args: {
        email: v.string(),
        code: v.string(),
    },
    handler: async (ctx, args) => {
        // 1. Initialize Resend
        const resendApiKey = process.env.RESEND_API_KEY;

        if (!resendApiKey) {
            console.warn("RESEND_API_KEY is not set. Skipping email sending.");
            console.log(`[DEV MODE] OTP for ${args.email}: ${args.code}`);
            return { success: false, error: "Missing API Key" };
        }

        const resend = new Resend(resendApiKey);

        try {
            // 2. Send Email
            const { data, error } = await resend.emails.send({
                from: "AMSquare <test@amsquare.xyz>", // Verified domain
                to: args.email,
                subject: "Your AMSquare Verification Code",
                html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #000;">AMSquare Verification</h1>
            <p>Your verification code is:</p>
            <div style="background: #f4f4f5; padding: 20px; border-radius: 12px; font-size: 24px; font-weight: bold; letter-spacing: 4px; text-align: center; margin: 20px 0;">
              ${args.code}
            </div>
            <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
          </div>
        `,
            });

            if (error) {
                console.error("Resend API Error:", error);
                return { success: false, error: error.message };
            }

            return { success: true, data };
        } catch (err: any) {
            console.error("Failed to send email:", err);
            return { success: false, error: err.message };
        }
    },
});

export const sendWelcomeEmail = action({
    args: {
        email: v.string(),
        name: v.string(),
    },
    handler: async (ctx, args) => {
        const resendApiKey = process.env.RESEND_API_KEY;

        if (!resendApiKey) {
            console.log(`[DEV MODE] Welcome Email to ${args.email}`);
            return { success: false, error: "Missing API Key" };
        }

        const resend = new Resend(resendApiKey);

        try {
            const { data, error } = await resend.emails.send({
                from: "AMSquare <test@amsquare.xyz>",
                to: args.email,
                subject: "Welcome to AMSquare",
                html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #000;">Welcome, ${args.name}!</h1>
            <p>We are thrilled to have you onboard.</p>
            <p>Get started by exploring your dashboard or setting up your first service.</p>
            <div style="margin: 20px 0;">
              <a href="https://amsquare.com" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Go to Dashboard</a>
            </div>
          </div>
        `,
            });

            if (error) {
                console.error("Resend API Error:", error);
                return { success: false, error: error.message };
            }

            return { success: true, data };
        } catch (err: any) {
            console.error("Failed to send email:", err);
            return { success: false, error: err.message };
        }
    },
});

export const sendInvitationEmail = action({
    args: {
        email: v.string(),
        inviterName: v.string(),
        token: v.string(),
    },
    handler: async (ctx, args) => {
        const resendApiKey = process.env.RESEND_API_KEY;

        if (!resendApiKey) {
            console.log(`[DEV MODE] Invite to ${args.email} from ${args.inviterName} Token: ${args.token}`);
            return { success: false, error: "Missing API Key" };
        }

        const resend = new Resend(resendApiKey);

        try {
            // Determine Base URL (Ideally this should be an environment variable like process.env.SITE_URL)
            // For now, we default to localhost for dev, but in prod it should be the real domain.
            const baseUrl = process.env.SITE_URL || "http://localhost:3000";
            const inviteUrl = `${baseUrl}/?inviteToken=${args.token}`;

            const { data, error } = await resend.emails.send({
                from: "AMSquare <test@amsquare.xyz>",
                to: args.email,
                subject: `${args.inviterName} invited you to AMSquare`,
                html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #000; margin-bottom: 20px;">You've been invited!</h1>
            <p style="color: #444; font-size: 16px; line-height: 1.5;">
                <strong>${args.inviterName}</strong> has invited you to join their team on <strong>AMSquare</strong>.
            </p>
            
            <div style="margin: 30px 0; text-align: center;">
              <a href="${inviteUrl}" style="background-color: #000; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
                Accept Invitation
              </a>
            </div>

            <p style="color: #666; font-size: 14px; margin-top: 30px;">
                Or copy and paste this link into your browser: <br/>
                <a href="${inviteUrl}" style="color: #000; text-decoration: underline;">${inviteUrl}</a>
            </p>
          </div>
        `,
            });

            if (error) {
                console.error("Resend API Error:", error);
                return { success: false, error: error.message };
            }

            return { success: true, data };
        } catch (err: any) {
            console.error("Failed to send email:", err);
            return { success: false, error: err.message };
        }
    },
});
