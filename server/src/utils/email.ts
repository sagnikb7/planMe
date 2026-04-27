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
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your planMe password</title>
</head>
<body style="margin:0;padding:0;background:#0f1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Logo / wordmark -->
          <tr>
            <td style="padding-bottom:32px;text-align:center;">
              <span style="font-size:22px;font-weight:700;letter-spacing:-0.03em;color:#f8f8f8;">plan<span style="color:#f59e0b;">Me</span></span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#1a1d27;border:1px solid #2a2d3a;border-radius:12px;padding:40px 36px;">

              <p style="margin:0 0 8px;font-size:20px;font-weight:600;color:#f8f8f8;letter-spacing:-0.02em;">Reset your password</p>
              <p style="margin:0 0 28px;font-size:14px;color:#94a3b8;line-height:1.6;">
                We received a request to reset the password for your planMe account. Click the button below to choose a new one.
              </p>

              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#f59e0b;border-radius:8px;">
                    <a href="${resetUrl}"
                       style="display:inline-block;padding:13px 28px;font-size:14px;font-weight:600;color:#111111;text-decoration:none;letter-spacing:-0.01em;">
                      Reset password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px;font-size:13px;color:#64748b;line-height:1.6;">
                This link expires in <strong style="color:#94a3b8;">${expiryHours} hour${expiryHours !== 1 ? 's' : ''}</strong>. If you did not request a password reset, you can safely ignore this email — your password will not change.
              </p>

              <!-- Fallback URL -->
              <p style="margin:0;font-size:12px;color:#475569;">
                If the button above doesn't work, paste this link into your browser:
              </p>
              <p style="margin:6px 0 0;font-size:12px;word-break:break-all;">
                <a href="${resetUrl}" style="color:#f59e0b;text-decoration:none;">${resetUrl}</a>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#475569;">
                planMe &nbsp;·&nbsp; You're receiving this because a password reset was requested for your account.
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

export async function sendPasswordResetEmail(to: string, resetUrl: string, expiryHours = 2): Promise<void> {
  if (!isSmtpConfigured()) return;

  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"planMe" <${env.smtp.from}>`,
    to,
    subject: 'Reset your planMe password',
    html: resetEmailHtml(resetUrl, expiryHours),
  });
}
