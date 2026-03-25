import nodemailer from 'nodemailer';

function createTransport() {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        throw new Error('Email service not configured. Please set SMTP_USER and SMTP_PASS in your .env.local file.');
    }
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
}


export interface SendOtpOptions {
    to: string;
    otp: string;
    labName?: string;
}

export async function sendOtpEmail({ to, otp, labName = 'IzyHealth' }: SendOtpOptions) {
    const transporter = createTransport();
    const from = process.env.SMTP_FROM || `IzyHealth <noreply@izyhealth.com>`;

    await transporter.sendMail({
        from,
        to,
        subject: `Your Password Reset OTP — ${labName}`,
        text: `Your OTP is: ${otp}\n\nThis OTP is valid for 10 minutes. Do not share it with anyone.`,
        html: `
        <div style="font-family:Segoe UI,sans-serif;max-width:480px;margin:0 auto;background:#f8fafc;padding:32px;border-radius:12px">
          <div style="text-align:center;margin-bottom:24px">
            <span style="font-size:28px;font-weight:700;background:linear-gradient(135deg,#3f51b5,#1a237e);-webkit-background-clip:text;-webkit-text-fill-color:transparent">
              ${labName}
            </span>
          </div>
          <div style="background:#fff;border-radius:10px;padding:28px;box-shadow:0 4px 16px rgba(0,0,0,.07)">
            <h2 style="margin:0 0 8px;color:#1e293b;font-size:20px">Password Reset OTP</h2>
            <p style="color:#64748b;font-size:14px;margin:0 0 24px">Use the OTP below to reset your password. It expires in <strong>10 minutes</strong>.</p>
            <div style="text-align:center;background:#f1f5f9;border-radius:8px;padding:20px;margin-bottom:24px">
              <span style="font-size:36px;font-weight:800;letter-spacing:10px;color:#3f51b5">${otp}</span>
            </div>
            <p style="color:#94a3b8;font-size:12px;margin:0">If you did not request this, please ignore this email. Your password will not change.</p>
          </div>
        </div>`,
    });
}
