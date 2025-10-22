import nodemailer from "nodemailer";

// Check if SMTP credentials are available
const hasSmtpCredentials = process.env.SMTP_USER && process.env.SMTP_PASS;

// Create transporter only if credentials are available
const transporter = hasSmtpCredentials ? nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
}) : null;

export async function sendVerificationEmail(email: string, name: string, token: string): Promise<{ sent: boolean; error?: string }> {
  // If no SMTP credentials, simulate sending for development
  if (!hasSmtpCredentials || !transporter) {
    console.log(`[DEV MODE] Verification email would be sent to ${email}`);
    console.log(`[DEV MODE] Verification URL: http://localhost:5000/verify-email/${token}`);
    return { sent: false, error: "SMTP not configured" };
  }

  const clientUrl = process.env.CLIENT_URL || "http://localhost:5000";
  const verificationUrl = `${clientUrl}/verify-email/${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || "noreply@agency.com",
    to: email,
    subject: "Verify Your Email - HUL Distribution Agency",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #059669;">Welcome to HUL Distribution Agency!</h1>
        <p>Dear ${name},</p>
        <p>Thank you for registering with our grocery distribution system. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="background-color: #f3f4f6; padding: 10px; border-radius: 4px; word-break: break-all;">
          ${verificationUrl}
        </p>
        <p>This link will expire in 24 hours for security reasons.</p>
        <p>If you didn't create an account with us, please ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          Best regards,<br>
          HUL Distribution Agency Team
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
    return { sent: true };
  } catch (error) {
    console.error("Failed to send verification email:", error);
    return { sent: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function sendPasswordResetEmail(email: string, name: string, resetUrl: string): Promise<{ sent: boolean; error?: string }> {
  // If no SMTP credentials, simulate sending for development
  if (!hasSmtpCredentials || !transporter) {
    console.log(`[DEV MODE] Password reset email would be sent to ${email}`);
    console.log(`[DEV MODE] Reset URL: ${resetUrl}`);
    return { sent: false, error: "SMTP not configured" };
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || "noreply@agency.com",
    to: email,
    subject: "Password Reset - HUL Distribution Agency",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #059669;">Password Reset Request</h1>
        <p>Dear ${name},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>This link will expire in 1 hour for security reasons.</p>
        <p>If you didn't request a password reset, please ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          Best regards,<br>
          HUL Distribution Agency Team
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { sent: true };
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    return { sent: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function sendOrderConfirmationEmail(email: string, name: string, order: { id: string; totalAmount: string | number; items: any[] }): Promise<{ sent: boolean; error?: string }> {
  if (!hasSmtpCredentials || !transporter) {
    console.log(`[DEV MODE] Order confirmation would be sent to ${email}`);
    console.log(`[DEV MODE] Order ID: ${order.id} - Amount: ${order.totalAmount}`);
    return { sent: false, error: "SMTP not configured" };
  }

  const itemListHtml = (order.items || []).map((it: any) => `
    <li>${it.name} x ${it.quantity} — ₹${it.price}</li>
  `).join("");

  const mailOptions = {
    from: process.env.EMAIL_FROM || "noreply@agency.com",
    to: email,
    subject: `Order Confirmation — ${order.id}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color:#059669">Order Confirmed</h2>
        <p>Hi ${name},</p>
        <p>Thanks for your order! Your order <strong>#${order.id}</strong> has been received and is being processed.</p>
        <p><strong>Total:</strong> ₹${order.totalAmount}</p>
        <p><strong>Items:</strong></p>
        <ul>
          ${itemListHtml}
        </ul>
        <p>We'll let you know when the order ships. If you have any questions, reply to this email.</p>
        <hr style="margin:30px 0; border:none; border-top:1px solid #e5e7eb;">
        <p style="color:#6b7280; font-size:14px;">Best regards,<br>HUL Distribution Agency Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Order confirmation email sent to ${email} for order ${order.id}`);
    return { sent: true };
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    return { sent: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
