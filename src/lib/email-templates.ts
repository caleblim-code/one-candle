export function verificationEmailHtml(name: string, verifyUrl: string) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; padding: 40px 20px; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #52A49A; font-size: 28px; margin: 0;">OneCandle</h1>
      </div>
      <div style="background-color: #1e293b; padding: 30px; border-radius: 8px; border: 1px solid #334155;">
        <h2 style="margin-top: 0; color: #f8fafc; font-size: 20px;">Verify your email address</h2>
        <p style="color: #94a3b8; font-size: 16px; line-height: 1.5;">Hi ${name},</p>
        <p style="color: #94a3b8; font-size: 16px; line-height: 1.5;">Welcome to OneCandle! Please click the button below to verify your email address and secure your account.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background-color: #52A49A; color: #000000; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">Verify Email</a>
        </div>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.5; margin-bottom: 0;">If you didn't create an account, you can safely ignore this email.</p>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #64748b; font-size: 12px;">
        &copy; ${new Date().getFullYear()} OneCandle. All rights reserved.
      </div>
    </div>
  `;
}

export function passwordResetEmailHtml(name: string, resetUrl: string) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #f8fafc; padding: 40px 20px; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #52A49A; font-size: 28px; margin: 0;">OneCandle</h1>
      </div>
      <div style="background-color: #1e293b; padding: 30px; border-radius: 8px; border: 1px solid #334155;">
        <h2 style="margin-top: 0; color: #f8fafc; font-size: 20px;">Reset your password</h2>
        <p style="color: #94a3b8; font-size: 16px; line-height: 1.5;">Hi ${name},</p>
        <p style="color: #94a3b8; font-size: 16px; line-height: 1.5;">We received a request to reset your password. Click the button below to create a new one.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #52A49A; color: #000000; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.5; margin-bottom: 0;">This link will expire in 30 minutes. If you didn't request a password reset, you can safely ignore this email.</p>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #64748b; font-size: 12px;">
        &copy; ${new Date().getFullYear()} OneCandle. All rights reserved.
      </div>
    </div>
  `;
}
