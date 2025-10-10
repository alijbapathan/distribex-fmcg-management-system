import nodemailer from "nodemailer";

// Twilio is optional. Import lazily to avoid hard dependency if not installed.
let twilioClient: any = null;
const hasTwilioCredentials = !!process.env.TWILIO_ACCOUNT_SID && !!process.env.TWILIO_AUTH_TOKEN;
if (hasTwilioCredentials) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const twilio = require("twilio");
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  } catch (err) {
    console.warn("Twilio SDK not available. SMS/WhatsApp notifications will be skipped.");
  }
}

// Email setup (optional)
const hasSmtpCredentials = !!process.env.SMTP_USER && !!process.env.SMTP_PASS;
const transporter = hasSmtpCredentials
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

type OrderLike = {
  id: string;
  totalAmount: string; // decimal as string
  shippingAmount?: string | null;
  discountAmount?: string | null;
  createdAt?: string | Date | null;
  shippingAddress: {
    fullName?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
};

export async function sendOrderConfirmationNotifications(order: OrderLike, userEmail: string, userName: string) {
  const tasks: Promise<unknown>[] = [];

  // Email (optional)
  tasks.push(
    (async () => {
      if (!transporter) {
        console.log(`[DEV MODE] Order confirmation email to ${userEmail} for order ${order.id}`);
        return;
      }
      const mailOptions = {
        from: process.env.EMAIL_FROM || "noreply@agency.com",
        to: userEmail,
        subject: `Your order ${order.id} is confirmed`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color:#059669;">Order Confirmed</h2>
            <p>Hi ${userName},</p>
            <p>Thank you for your purchase. Your order <b>${order.id}</b> has been confirmed.</p>
            <p>Total: <b>₹${order.totalAmount}</b></p>
            <p>We'll notify you when it ships.</p>
          </div>
        `,
      };
      try {
        await transporter.sendMail(mailOptions);
      } catch (e) {
        console.error("Failed to send order confirmation email:", e);
      }
    })()
  );

  // SMS/WhatsApp via Twilio (optional)
  tasks.push(
    (async () => {
      const phone = order.shippingAddress?.phone;
      if (!twilioClient || !hasTwilioCredentials || !phone) {
        console.log(`[DEV MODE] SMS/WhatsApp confirmation to ${phone || "<no-phone>"} for order ${order.id}`);
        return;
      }

      const message = `Hi ${userName}, your order ${order.id} is confirmed. Total: ₹${order.totalAmount}. Thank you!`;
      const smsFrom = process.env.TWILIO_SMS_FROM; // e.g., +1XXXXXXXXXX
      const waFrom = process.env.TWILIO_WHATSAPP_FROM; // e.g., whatsapp:+14155238886

      try {
        if (smsFrom) {
          await twilioClient.messages.create({ from: smsFrom, to: phone, body: message });
        }
      } catch (e) {
        console.error("Failed to send SMS notification:", e);
      }

      try {
        if (waFrom) {
          const toWhatsApp = phone.startsWith("whatsapp:") ? phone : `whatsapp:${phone}`;
          await twilioClient.messages.create({ from: waFrom, to: toWhatsApp, body: message });
        }
      } catch (e) {
        console.error("Failed to send WhatsApp notification:", e);
      }
    })()
  );

  await Promise.allSettled(tasks);
}


