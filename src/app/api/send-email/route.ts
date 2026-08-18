import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    // Validate request body
    if (!email || !code) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing email or verification code",
        },
        { status: 400 }
      );
    }

    // Check environment variables
    //const emailUser = process.env.EMAIL_USER;
    //const emailPass = process.env.EMAIL_PASS;

    // Check environment variables updated dapat ingani.
    const runtimeEnvironment = process.env;

    const emailUser = runtimeEnvironment.EMAIL_USER;
    const emailPass = runtimeEnvironment.EMAIL_PASS;

    if (!emailUser || !emailPass) {
      console.error("❌ Missing email environment variables", {
        EMAIL_USER: !!emailUser,
        EMAIL_PASS: !!emailPass,
      });

      return NextResponse.json(
        {
          success: false,
          error: "Email server configuration is missing",
        },
        { status: 500 }
      );
    }

    // Create Gmail SMTP transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    // Verify SMTP connection/authentication first
    try {
      await transporter.verify();
      console.log("✅ Gmail SMTP connection verified");
    } catch (smtpError: any) {
      console.error("❌ Gmail SMTP verification failed:", {
        message: smtpError?.message,
        code: smtpError?.code,
        command: smtpError?.command,
        response: smtpError?.response,
      });

      return NextResponse.json(
        {
          success: false,
          error: "Gmail SMTP authentication failed",
          details: smtpError?.message || "Unknown SMTP error",
          code: smtpError?.code || null,
        },
        { status: 500 }
      );
    }

    // Email content
    const mailOptions = {
      from: `"MON CHER" <${emailUser}>`,
      to: email,
      subject: "Your Secure Login OTP",
      html: `
        <div style="
          font-family: sans-serif;
          text-align: center;
          padding: 30px;
          background-color: #0a0a0e;
          color: #ffffff;
          border-radius: 12px;
          max-width: 400px;
          margin: auto;
          border: 1px solid #333;
        ">
          <h2 style="
            color: #f472b6;
            margin-bottom: 5px;
          ">
            MON CHER
          </h2>

          <p style="
            font-size: 14px;
            color: #aaaaaa;
            margin-bottom: 25px;
          ">
            Here is your secure login code:
          </p>

          <div style="
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            color: #ffffff;
            background-color: #1a1a24;
            padding: 15px 20px;
            border-radius: 8px;
            display: inline-block;
          ">
            ${code}
          </div>

          <p style="
            font-size: 12px;
            color: #666666;
            margin-top: 30px;
          ">
            Safe travels through the digital walls.
          </p>
        </div>
      `,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Email sent successfully:", {
      messageId: info.messageId,
      response: info.response,
    });

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error: any) {
    console.error("❌ Nodemailer Error Details:", {
      message: error?.message,
      code: error?.code,
      command: error?.command,
      response: error?.response,
      stack: error?.stack,
    });

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to send email",
        code: error?.code || null,
      },
      { status: 500 }
    );
  }
}
