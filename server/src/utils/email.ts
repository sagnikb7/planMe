import nodemailer from 'nodemailer';
import { env } from '../config/env';

function isSmtpConfigured(): boolean {
  return Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);
}

function createTransporter() {
  return nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: { user: env.smtp.user, pass: env.smtp.pass },
  });
}

function resetEmailHtml(resetUrl: string, expiryHours: number): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Reset your planMe password</title>
</head>
<body style="margin:0;padding:0;background:#111111;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">

  <!-- Preheader: shown in email client preview after the subject line -->
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    Reset your password — this link expires in ${expiryHours} hour${expiryHours !== 1 ? 's' : ''}. If you didn't request this, ignore this email.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#111111;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:32px;text-align:center;">
              <span style="font-size:20px;letter-spacing:-0.03em;">
                <span style="color:#f59e0b;margin-right:6px;">✦</span><span style="font-weight:300;color:#888888;">plan</span><span style="font-weight:600;color:#e8e8e8;">Me</span>
              </span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#1a1a1a;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:40px 36px;">

              <p style="margin:0 0 8px;font-size:20px;font-weight:600;color:#e8e8e8;letter-spacing:-0.02em;">Reset your password</p>
              <p style="margin:0 0 28px;font-size:14px;color:#888888;line-height:1.6;">
                Someone requested a password reset for your planMe account. If that was you, click below to choose a new one.
              </p>

              <!-- CTA button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#f59e0b;border-radius:8px;">
                    <a href="${resetUrl}"
                       style="display:inline-block;padding:13px 28px;font-size:14px;font-weight:600;color:#111111;text-decoration:none;letter-spacing:-0.01em;">
                      Reset password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px;font-size:13px;color:#666666;line-height:1.6;">
                This link expires in <strong style="color:#888888;">${expiryHours} hour${expiryHours !== 1 ? 's' : ''}</strong>. If you didn't request a reset, you can safely ignore this — your password won't change.
              </p>

              <hr style="border:none;border-top:1px solid rgba(255,255,255,0.07);margin:20px 0;" />

              <!-- Fallback URL -->
              <p style="margin:0 0 4px;font-size:12px;color:#555555;">Button not working? Copy this link into your browser:</p>
              <p style="margin:0;font-size:12px;word-break:break-all;">
                <a href="${resetUrl}" style="color:#f59e0b;text-decoration:none;">${resetUrl}</a>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#444444;line-height:1.6;">
                planMe &nbsp;·&nbsp; This email was sent because a password reset was requested for your account.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function resetEmailText(resetUrl: string, expiryHours: number): string {
  return `Reset your planMe password

Someone requested a password reset for your planMe account. If that was you, open the link below to choose a new password.

${resetUrl}

This link expires in ${expiryHours} hour${expiryHours !== 1 ? 's' : ''}. If you didn't request a reset, ignore this email — your password won't change.

— planMe
`;
}

export async function sendPasswordResetEmail(to: string, resetUrl: string, expiryHours = 2): Promise<void> {
  if (!isSmtpConfigured()) return;

  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"planMe" <${env.smtp.from}>`,
    to,
    subject: 'Reset your planMe password',
    text: resetEmailText(resetUrl, expiryHours),
    html: resetEmailHtml(resetUrl, expiryHours),
  });
}
