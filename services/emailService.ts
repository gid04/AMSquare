// Email service using Resend
// This will be called from Convex functions

export async function sendOTPEmail(email: string, code: string): Promise<boolean> {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (!RESEND_API_KEY) {
        console.error('RESEND_API_KEY not configured');
        // For development, log the OTP instead
        console.log(`[DEV] OTP for ${email}: ${code}`);
        return true;
    }

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: 'AMSquare <onboarding@amsquare.com>',
                to: email,
                subject: 'Your AMSquare Verification Code',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); padding: 40px; text-align: center;">
              <h1 style="color: #50C913; margin: 0; font-size: 28px;">AMSquare Enterprise</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 12px; letter-spacing: 2px;">ADVANCED AGENTIC MONEY MANAGEMENT</p>
            </div>
            <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e5e5;">
              <h2 style="color: #000000; margin: 0 0 20px 0;">Your Verification Code</h2>
              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                Welcome to AMSquare! Use the verification code below to complete your authentication:
              </p>
              <div style="background: #f5f5f5; border: 2px solid #50C913; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                <p style="color: #666666; margin: 0 0 10px 0; font-size: 14px;">Your verification code is:</p>
                <p style="color: #000000; font-size: 48px; font-weight: bold; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">${code}</p>
              </div>
              <p style="color: #666666; font-size: 14px; line-height: 1.6;">
                This code will expire in <strong>10 minutes</strong>. If you didn't request this code, please ignore this email.
              </p>
            </div>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #e5e5e5;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                © 2026 AMSquare Enterprise. All rights reserved.
              </p>
            </div>
          </div>
        `,
            }),
        });

        if (!response.ok) {
            console.error('Failed to send email:', await response.text());
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error sending OTP email:', error);
        return false;
    }
}

export async function sendInvitationEmail(
    email: string,
    inviterName: string,
    businessName: string,
    accessLevel: string,
    invitationToken: string
): Promise<boolean> {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (!RESEND_API_KEY) {
        console.error('RESEND_API_KEY not configured');
        console.log(`[DEV] Invitation for ${email} from ${inviterName} (${accessLevel})`);
        console.log(`[DEV] Token: ${invitationToken}`);
        return true;
    }

    const acceptUrl = `${process.env.VITE_APP_URL || 'http://localhost:5173'}/accept-invitation?token=${invitationToken}`;

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: 'AMSquare <team@amsquare.com>',
                to: email,
                subject: `You've been invited to join ${businessName} on AMSquare`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); padding: 40px; text-align: center;">
              <h1 style="color: #50C913; margin: 0; font-size: 28px;">AMSquare Enterprise</h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 12px; letter-spacing: 2px;">ADVANCED AGENTIC MONEY MANAGEMENT</p>
            </div>
            <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e5e5;">
              <h2 style="color: #000000; margin: 0 0 20px 0;">You've Been Invited!</h2>
              <p style="color: #666666; font-size: 16px; line-height: 1.6;">
                <strong>${inviterName}</strong> has invited you to join <strong>${businessName}</strong> on AMSquare Enterprise.
              </p>
              <div style="background: #f5f5f5; border-left: 4px solid #50C913; padding: 20px; margin: 30px 0;">
                <p style="color: #000000; margin: 0 0 10px 0; font-size: 14px;"><strong>Your Access Level:</strong></p>
                <p style="color: #50C913; font-size: 20px; font-weight: bold; margin: 0;">${accessLevel}</p>
              </div>
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 30px 0;">
                Click the button below to accept your invitation and set up your account:
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${acceptUrl}" style="display: inline-block; background: #000000; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px;">
                  Accept Invitation
                </a>
              </div>
              <p style="color: #999999; font-size: 12px; line-height: 1.6;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${acceptUrl}" style="color: #50C913; word-break: break-all;">${acceptUrl}</a>
              </p>
            </div>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #e5e5e5;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                © 2026 AMSquare Enterprise. All rights reserved.
              </p>
            </div>
          </div>
        `,
            }),
        });

        if (!response.ok) {
            console.error('Failed to send invitation email:', await response.text());
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error sending invitation email:', error);
        return false;
    }
}
