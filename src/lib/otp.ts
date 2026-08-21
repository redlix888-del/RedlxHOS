import { Resend } from "resend";
import { prisma } from "./db";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

export function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export async function sendOTPEmail(email: string, otp: string) {
  try {
    const fromEmail = process.env.RESEND_FROM_EMAIL || "support@app.redlix.co.in";
    const { data, error } = await resend.emails.send({
      from: `HackOS <${fromEmail}>`,
      to: email,
      subject: "Your HackOS Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #333; text-align: center;">HackOS Verification Code</h2>
          <p style="color: #555; font-size: 16px;">Hello,</p>
          <p style="color: #555; font-size: 16px;">Here is your One-Time Password (OTP) to proceed with your registration:</p>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 4px;">
            ${otp}
          </div>
          <p style="color: #555; font-size: 14px;">This code is valid for 10 minutes. If you did not request this, please ignore this email.</p>
          <br />
          <p style="color: #888; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} Redlix Studio. All rights reserved.</p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend Email error:", error);
      return { success: false, error: "Failed to send OTP email." };
    }

    return { success: true };
  } catch (err) {
    console.error("sendOTPEmail error:", err);
    return { success: false, error: "Failed to send OTP email." };
  }
}

export async function storeOTP(email: string, otp: string) {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
  
  await prisma.oTPVerification.upsert({
    where: { email },
    update: {
      otp,
      expiresAt,
      createdAt: new Date(),
    },
    create: {
      email,
      otp,
      expiresAt,
    },
  });
}

export async function verifyOTP(email: string, otp: string) {
  const record = await prisma.oTPVerification.findUnique({
    where: { email },
  });

  if (!record) {
    return { success: false, error: "OTP not found or expired." };
  }

  if (record.otp !== otp) {
    return { success: false, error: "Invalid OTP code." };
  }

  if (record.expiresAt < new Date()) {
    return { success: false, error: "OTP has expired." };
  }

  // Delete after successful verification
  await prisma.oTPVerification.delete({
    where: { email },
  });

  return { success: true };
}
