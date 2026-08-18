import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    // Setup sa email sender gamit ang imong Gmail gikan sa .env.local
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Design sa email nga madawat sa user
    const mailOptions = {
      from: `"MON CHER" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Secure Login OTP',
      html: `
        <div style="font-family: sans-serif; text-align: center; padding: 30px; background-color: #0a0a0e; color: #ffffff; border-radius: 12px; max-width: 400px; margin: auto; border: 1px solid #333;">
          <h2 style="color: #f472b6; margin-bottom: 5px;">MON CHER</h2>
          <p style="font-size: 14px; color: #aaaaaa; margin-bottom: 25px;">Here is your secure login code:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #ffffff; background-color: #1a1a24; padding: 15px 20px; border-radius: 8px; display: inline-block;">
            ${code}
          </div>
          <p style="font-size: 12px; color: #666666; margin-top: 30px;">Safe travels through the digital walls.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("Email error:", error);
    return NextResponse.json({ success: false, error: "Failed to send email" }, { status: 500 });
  }
}