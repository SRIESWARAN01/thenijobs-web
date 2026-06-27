/**
 * Theni Jobs — Premium Email Templates
 *
 * Pure HTML + inline CSS, responsive design, optimized for:
 * Gmail, Outlook, Apple Mail, Yahoo Mail, and other major clients.
 * Uses robust table structures, bulletproof buttons, and proper styling.
 */

interface BaseEmailParams {
  preheader: string;
  title: string;
  userName: string;
  bodyHtml: string;
  cta?: { label: string; url: string };
  notice?: string; // e.g., "This link expires in 15 minutes"
  warning?: string; // e.g., "Didn't request this?"
}

/**
 * Builds the base HTML wrapper for all premium emails
 */
function buildBaseEmailHtml(params: BaseEmailParams): string {
  const { preheader, title, userName, bodyHtml, cta, notice, warning } = params;
  const currentYear = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no" />
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .fluid { max-width: 100% !important; height: auto !important; }
      .padding-mobile { padding-left: 20px !important; padding-right: 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', Arial, sans-serif;">

  <!-- Preheader Text -->
  <div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    ${preheader}
  </div>

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #0a0a1a;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" class="email-container" style="max-width: 560px; width: 100%;">

          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding: 0 0 32px 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="vertical-align: middle; padding-right: 10px;">
                    <div style="width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #7c3aed, #a855f7); text-align: center; line-height: 36px;">
                      <span style="color: #ffffff; font-weight: 900; font-size: 16px;">T</span>
                    </div>
                  </td>
                  <td style="vertical-align: middle;">
                    <span style="font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
                      <span style="background: linear-gradient(135deg, #7c3aed, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">THENI</span><span style="color: #ffffff;">JOBS</span>
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #12122a; border: 1px solid rgba(124, 58, 237, 0.15); border-radius: 24px; overflow: hidden;">
                <tr>
                  <td style="height: 4px; background: linear-gradient(90deg, #7c3aed, #a855f7, #c084fc); font-size: 0; line-height: 0;">&nbsp;</td>
                </tr>

                <!-- Content Area -->
                <tr>
                  <td style="padding: 40px;" class="padding-mobile">
                    <!-- Title -->
                    <h1 style="margin: 0 0 24px 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px; line-height: 1.3; text-align: center;">
                      ${title}
                    </h1>

                    <!-- Greeting -->
                    <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.7; color: #a1a1b5;">
                      Hello <strong style="color: #ffffff;">${userName}</strong>,
                    </p>

                    <!-- Body Content -->
                    <div style="font-size: 15px; line-height: 1.7; color: #a1a1b5; margin-bottom: 24px;">
                      ${bodyHtml}
                    </div>

                    <!-- CTA Button -->
                    ${cta ? `
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0;">
                      <tr>
                        <td align="center">
                          <!--[if mso]>
                          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${cta.url}" style="height:52px;v-text-anchor:middle;width:280px;" arcsize="50%" strokeweight="0" fillcolor="#7c3aed">
                            <w:anchorlock/>
                            <center style="color:#ffffff;font-family:sans-serif;font-size:15px;font-weight:bold;">${cta.label}</center>
                          </v:roundrect>
                          <![endif]-->
                          <!--[if !mso]><!-->
                          <a href="${cta.url}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #9333ea); color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 16px 48px; border-radius: 50px; letter-spacing: 0.3px; box-shadow: 0 4px 20px rgba(124, 58, 237, 0.4); mso-padding-alt: 0;">
                            ${cta.label}
                          </a>
                          <!--<![endif]-->
                        </td>
                      </tr>
                    </table>
                    ` : ''}

                    <!-- Notice Card -->
                    ${notice ? `
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0 0 0; background-color: rgba(124, 58, 237, 0.08); border: 1px solid rgba(124, 58, 237, 0.12); border-radius: 12px;">
                      <tr>
                        <td style="padding: 12px 20px;" align="center">
                          <p style="margin: 0; font-size: 12px; color: #c084fc; line-height: 1.5;">
                            ${notice}
                          </p>
                        </td>
                      </tr>
                    </table>
                    ` : ''}

                    <!-- Fallback Link -->
                    ${cta ? `
                    <div style="margin: 28px 0 0 0; padding-top: 20px; border-t: 1px solid rgba(255,255,255,0.06);">
                      <p style="margin: 0; font-size: 11px; color: #6b6b80; line-height: 1.6;">
                        If the button doesn't work, copy and paste this link into your browser:
                      </p>
                      <p style="margin: 6px 0 0 0; word-break: break-all;">
                        <a href="${cta.url}" style="font-size: 11px; color: #a855f7; text-decoration: underline; line-height: 1.5;">${cta.url}</a>
                      </p>
                    </div>
                    ` : ''}

                    <!-- Warning Box -->
                    ${warning ? `
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 28px 0 0 0; background-color: rgba(251, 191, 36, 0.06); border: 1px solid rgba(251, 191, 36, 0.12); border-radius: 12px;">
                      <tr>
                        <td style="padding: 16px 20px;">
                          <p style="margin: 0 0 4px 0; font-size: 13px; color: #fbbf24; font-weight: 600; line-height: 1.4;">
                            ⚠️ Security Notice
                          </p>
                          <p style="margin: 0; font-size: 12px; color: #a1a1b5; line-height: 1.6;">
                            ${warning}
                          </p>
                        </td>
                      </tr>
                    </table>
                    ` : ''}

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 20px 0 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 16px;">
                    <p style="margin: 0; font-size: 12px; color: #6b6b80; line-height: 1.6;">
                      Need help? Contact us at
                      <a href="mailto:support@thenijobs.com" style="color: #a855f7; text-decoration: none;">support@thenijobs.com</a>
                    </p>
                  </td>
                </tr>
              </table>

              <div style="height: 1px; background-color: rgba(255,255,255,0.04); margin-bottom: 16px;"></div>

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <p style="margin: 0; font-size: 13px; font-weight: 700; letter-spacing: -0.3px;">
                      <span style="color: #7c3aed;">THENI</span><span style="color: #ffffff;">JOBS</span>
                    </p>
                    <p style="margin: 4px 0 0 0; font-size: 11px; color: #4a4a5e; font-style: italic;">
                      Connecting Talent with Opportunity
                    </p>
                  </td>
                </tr>
              </table>

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 12px 0;">
                    <a href="https://thenijobs.com" style="font-size: 11px; color: #6b6b80; text-decoration: none; padding: 0 8px;">Website</a>
                    <span style="color: #2a2a3e;">|</span>
                    <a href="https://thenijobs.com/jobs" style="font-size: 11px; color: #6b6b80; text-decoration: none; padding: 0 8px;">Browse Jobs</a>
                    <span style="color: #2a2a3e;">|</span>
                    <a href="mailto:support@thenijobs.com" style="font-size: 11px; color: #6b6b80; text-decoration: none; padding: 0 8px;">Support</a>
                  </td>
                </tr>
              </table>

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 0 0 8px 0;">
                    <p style="margin: 0; font-size: 10px; color: #3a3a4e; line-height: 1.5;">
                      &copy; ${currentYear} Theni Jobs. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ──────────────────────────────────────────────────────────────────
// 1. WELCOME EMAIL
// ──────────────────────────────────────────────────────────────────
export function getWelcomeEmailHtml(userName: string, dashboardUrl: string): string {
  return buildBaseEmailHtml({
    preheader: 'Welcome to Theni Jobs! Let\'s build your professional presence.',
    title: 'Welcome to Theni Jobs!',
    userName,
    bodyHtml: `Thank you for joining our platform. We are excited to help you connect with top local talent and job opportunities in the Theni district.<br/><br/>
    Complete your profile today to stand out to employers and get recommendations matched to your skills.`,
    cta: { label: 'Go to Dashboard', url: dashboardUrl },
  });
}

// ──────────────────────────────────────────────────────────────────
// 2. ACCOUNT VERIFICATION
// ──────────────────────────────────────────────────────────────────
export function getAccountVerificationEmailHtml(userName: string, verificationUrl: string): string {
  return buildBaseEmailHtml({
    preheader: 'Verify your email address to activate your Theni Jobs account.',
    title: 'Verify Your Email Address',
    userName,
    bodyHtml: 'Thank you for registering. Please click the button below to verify your email address and activate your account.',
    cta: { label: 'Verify Email Address', url: verificationUrl },
    notice: '⏱️ This link will expire in 24 hours.',
    warning: 'If you did not create a Theni Jobs account, you can safely ignore this email.',
  });
}

// ──────────────────────────────────────────────────────────────────
// 3. PASSWORD RESET (Matches previous custom template specs)
// ──────────────────────────────────────────────────────────────────
export function getPasswordResetEmailHtml(params: {
  userName: string;
  resetLink: string;
  expiryMinutes?: number;
}): string {
  const { userName, resetLink, expiryMinutes = 15 } = params;
  return buildBaseEmailHtml({
    preheader: `Reset your password. Link expires in ${expiryMinutes} minutes.`,
    title: 'Forgot Your Password?',
    userName,
    bodyHtml: 'We received a request to reset the password for your Theni Jobs account. If you made this request, click the button below to set a new password.',
    cta: { label: 'Reset Password', url: resetLink },
    notice: `⏱️ This link will expire in ${expiryMinutes} minutes.`,
    warning: 'If you did not request a password reset, please ignore this email. Your account remains secure.',
  });
}

export function getPasswordResetEmailText(params: {
  userName: string;
  resetLink: string;
  expiryMinutes?: number;
}): string {
  const { userName, resetLink, expiryMinutes = 15 } = params;
  return `THENI JOBS — Password Reset

Hello ${userName},

We received a request to reset your password. Click the link below:
${resetLink}

⏱️ Expiry time: ${expiryMinutes} minutes.

If you didn't request a reset, ignore this email. Your account remains secure.
`;
}

// ──────────────────────────────────────────────────────────────────
// 4. INTERVIEW INVITATION
// ──────────────────────────────────────────────────────────────────
export function getInterviewInvitationEmailHtml(params: {
  userName: string;
  companyName: string;
  jobTitle: string;
  date: string;
  time: string;
  location: string;
  respondUrl: string;
}): string {
  const { userName, companyName, jobTitle, date, time, location, respondUrl } = params;
  return buildBaseEmailHtml({
    preheader: `Congratulations! You have an interview invitation from ${companyName}.`,
    title: 'Interview Invitation',
    userName,
    bodyHtml: `Great news! <strong>${companyName}</strong> has invited you to interview for the position of <strong>${jobTitle}</strong>.<br/><br/>
    <strong>Interview Details:</strong><br/>
    📅 Date: ${date}<br/>
    🕒 Time: ${time}<br/>
    📍 Format/Location: ${location}<br/><br/>
    Click the button below to confirm your availability or propose a reschedule.`,
    cta: { label: 'Respond to Interview', url: respondUrl },
  });
}

// ──────────────────────────────────────────────────────────────────
// 5. JOB APPLICATION UPDATE
// ──────────────────────────────────────────────────────────────────
export function getApplicationUpdateEmailHtml(params: {
  userName: string;
  companyName: string;
  jobTitle: string;
  status: 'Shortlisted' | 'Reviewed' | 'Contacted' | 'Closed';
  statusColor?: string;
  applicationUrl: string;
}): string {
  const { userName, companyName, jobTitle, status, statusColor = '#7c3aed', applicationUrl } = params;
  return buildBaseEmailHtml({
    preheader: `Your application status at ${companyName} has been updated.`,
    title: 'Application Status Update',
    userName,
    bodyHtml: `Your job application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been updated.<br/><br/>
    <strong>New Status:</strong> <span style="font-weight: 800; color: ${statusColor};">${status}</span>`,
    cta: { label: 'View Application details', url: applicationUrl },
  });
}

// ──────────────────────────────────────────────────────────────────
// 6. ADVERTISEMENT CONFIRMATION
// ──────────────────────────────────────────────────────────────────
export function getAdConfirmationEmailHtml(params: {
  userName: string;
  campaignName: string;
  durationDays: number;
  amount: number;
  analyticsUrl: string;
}): string {
  const { userName, campaignName, durationDays, amount, analyticsUrl } = params;
  return buildBaseEmailHtml({
    preheader: 'Your promotion campaign is now active on Theni Jobs.',
    title: 'Promotion Campaign Live',
    userName,
    bodyHtml: `Your advertisement campaign is confirmed and now visible to users on our platform!<br/><br/>
    <strong>Campaign Details:</strong><br/>
    🏷️ Name: ${campaignName}<br/>
    ⏳ Duration: ${durationDays} Days<br/>
    💵 Paid: ₹${amount.toLocaleString('en-IN')}<br/><br/>
    Track impressions, click analytics, and lead metrics in your analytics dashboard.`,
    cta: { label: 'View Analytics Dashboard', url: analyticsUrl },
  });
}

// ──────────────────────────────────────────────────────────────────
// 7. SUBSCRIPTION RENEWAL REMINDER
// ──────────────────────────────────────────────────────────────────
export function getSubscriptionRenewalReminderEmailHtml(params: {
  userName: string;
  planName: string;
  expiryDate: string;
  renewUrl: string;
}): string {
  const { userName, planName, expiryDate, renewUrl } = params;
  return buildBaseEmailHtml({
    preheader: `Your ${planName} subscription expires on ${expiryDate}. Renew now!`,
    title: 'Subscription Expiry Reminder',
    userName,
    bodyHtml: `Your <strong>${planName}</strong> subscription is due to expire on <strong>${expiryDate}</strong>.<br/><br/>
    Renew your plan today to prevent service interruption, keep your featured job listings active, and maintain your premium business search ranking.`,
    cta: { label: 'Renew Plan Now', url: renewUrl },
  });
}

// ──────────────────────────────────────────────────────────────────
// 8. PAYMENT SUCCESS
// ──────────────────────────────────────────────────────────────────
export function getPaymentSuccessEmailHtml(params: {
  userName: string;
  txId: string;
  planName: string;
  amount: number;
  date: string;
  dashboardUrl: string;
}): string {
  const { userName, txId, planName, amount, date, dashboardUrl } = params;
  return buildBaseEmailHtml({
    preheader: 'Payment receipt confirmation for your subscription.',
    title: 'Payment Successful',
    userName,
    bodyHtml: `Thank you for your transaction. Your payment has been processed successfully.<br/><br/>
    <strong>Receipt Summary:</strong><br/>
    💳 Transaction ID: ${txId}<br/>
    📦 Plan/Service: ${planName}<br/>
    💵 Amount: ₹${amount.toLocaleString('en-IN')}<br/>
    📅 Date: ${date}`,
    cta: { label: 'Go to Dashboard', url: dashboardUrl },
  });
}

// ──────────────────────────────────────────────────────────────────
// 9. PAYMENT FAILED
// ──────────────────────────────────────────────────────────────────
export function getPaymentFailedEmailHtml(params: {
  userName: string;
  planName: string;
  amount: number;
  retryUrl: string;
}): string {
  const { userName, planName, amount, retryUrl } = params;
  return buildBaseEmailHtml({
    preheader: 'Action required: payment process failure notification.',
    title: 'Payment Attempt Failed',
    userName,
    bodyHtml: `We were unable to process your payment of <strong>₹${amount.toLocaleString('en-IN')}</strong> for the <strong>${planName}</strong> subscription.<br/><br/>
    Please update your payment method or try again to avoid service interruption.`,
    cta: { label: 'Retry Payment Now', url: retryUrl },
  });
}

// ──────────────────────────────────────────────────────────────────
// 10. ADMIN ANNOUNCEMENT
// ──────────────────────────────────────────────────────────────────
export function getAdminAnnouncementEmailHtml(params: {
  userName: string;
  subject: string;
  messageBodyHtml: string;
  actionUrl?: string;
  actionLabel?: string;
}): string {
  const { userName, subject, messageBodyHtml, actionUrl, actionLabel = 'Learn More' } = params;
  return buildBaseEmailHtml({
    preheader: subject,
    title: subject,
    userName,
    bodyHtml: messageBodyHtml,
    cta: actionUrl ? { label: actionLabel, url: actionUrl } : undefined,
  });
}
