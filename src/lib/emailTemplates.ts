/**
 * Theni Jobs — Password Reset Email Template
 *
 * Pure HTML + inline CSS, compatible with Gmail, Outlook, Apple Mail, Yahoo Mail.
 * No external CSS, no JavaScript. Fully responsive.
 */

export function getPasswordResetEmailHtml(params: {
  userName: string;
  resetLink: string;
  expiryMinutes?: number;
}): string {
  const { userName, resetLink, expiryMinutes = 15 } = params;
  const currentYear = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no" />
  <title>Reset Your Password — Theni Jobs</title>
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
    /* Reset */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    /* Responsive */
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .fluid { max-width: 100% !important; height: auto !important; }
      .stack-column { display: block !important; width: 100% !important; }
      .padding-mobile { padding-left: 20px !important; padding-right: 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', Arial, sans-serif;">

  <!-- Visually Hidden Preheader Text -->
  <div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    Reset your Theni Jobs password. This link expires in ${expiryMinutes} minutes.
  </div>

  <!-- Email Body -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #0a0a1a;">
    <tr>
      <td align="center" style="padding: 40px 16px;">

        <!-- Email Container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" class="email-container" style="max-width: 560px; width: 100%;">

          <!-- ====== LOGO HEADER ====== -->
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

          <!-- ====== MAIN CARD ====== -->
          <tr>
            <td>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #12122a; border: 1px solid rgba(124, 58, 237, 0.15); border-radius: 24px; overflow: hidden;">

                <!-- Purple Gradient Top Bar -->
                <tr>
                  <td style="height: 4px; background: linear-gradient(90deg, #7c3aed, #a855f7, #c084fc); font-size: 0; line-height: 0;">&nbsp;</td>
                </tr>

                <!-- Lock Icon -->
                <tr>
                  <td align="center" style="padding: 40px 40px 0 40px;" class="padding-mobile">
                    <div style="width: 72px; height: 72px; border-radius: 50%; background: linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(168, 85, 247, 0.1)); border: 1px solid rgba(124, 58, 237, 0.2); text-align: center; line-height: 72px;">
                      <span style="font-size: 32px;">🔐</span>
                    </div>
                  </td>
                </tr>

                <!-- Title -->
                <tr>
                  <td align="center" style="padding: 24px 40px 0 40px;" class="padding-mobile">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px; line-height: 1.3;">
                      Forgot Your Password?
                    </h1>
                  </td>
                </tr>

                <!-- Greeting -->
                <tr>
                  <td style="padding: 20px 40px 0 40px;" class="padding-mobile">
                    <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #a1a1b5;">
                      Hello <strong style="color: #ffffff;">${userName}</strong>,
                    </p>
                  </td>
                </tr>

                <!-- Body Text -->
                <tr>
                  <td style="padding: 12px 40px 0 40px;" class="padding-mobile">
                    <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #a1a1b5;">
                      We received a request to reset the password for your Theni Jobs account. If you made this request, use the button below to set a new password.
                    </p>
                  </td>
                </tr>

                <!-- CTA Button -->
                <tr>
                  <td align="center" style="padding: 32px 40px 0 40px;" class="padding-mobile">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${resetLink}" style="height:52px;v-text-anchor:middle;width:280px;" arcsize="50%" strokeweight="0" fillcolor="#7c3aed">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:sans-serif;font-size:15px;font-weight:bold;">Reset Password</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="${resetLink}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #9333ea); color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 16px 48px; border-radius: 50px; letter-spacing: 0.3px; box-shadow: 0 4px 20px rgba(124, 58, 237, 0.4); mso-padding-alt: 0;">
                      Reset Password →
                    </a>
                    <!--<![endif]-->
                  </td>
                </tr>

                <!-- Expiry Notice -->
                <tr>
                  <td align="center" style="padding: 20px 40px 0 40px;" class="padding-mobile">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="background-color: rgba(124, 58, 237, 0.08); border: 1px solid rgba(124, 58, 237, 0.12); border-radius: 12px;">
                      <tr>
                        <td style="padding: 12px 20px;">
                          <p style="margin: 0; font-size: 12px; color: #c084fc; text-align: center; line-height: 1.5;">
                            ⏱️ This link will expire in <strong style="color: #d8b4fe;">${expiryMinutes} minutes</strong>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Fallback Link -->
                <tr>
                  <td style="padding: 24px 40px 0 40px;" class="padding-mobile">
                    <p style="margin: 0; font-size: 12px; color: #6b6b80; line-height: 1.6;">
                      If the button doesn't work, copy and paste this link into your browser:
                    </p>
                    <p style="margin: 8px 0 0 0; word-break: break-all;">
                      <a href="${resetLink}" style="font-size: 12px; color: #a855f7; text-decoration: underline; line-height: 1.5;">${resetLink}</a>
                    </p>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding: 28px 40px 0 40px;" class="padding-mobile">
                    <div style="height: 1px; background-color: rgba(255,255,255,0.06);"></div>
                  </td>
                </tr>

                <!-- Security Warning -->
                <tr>
                  <td style="padding: 20px 40px 36px 40px;" class="padding-mobile">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: rgba(251, 191, 36, 0.06); border: 1px solid rgba(251, 191, 36, 0.12); border-radius: 12px;">
                      <tr>
                        <td style="padding: 16px 20px;">
                          <p style="margin: 0; font-size: 13px; color: #fbbf24; font-weight: 600; line-height: 1.4;">
                            ⚠️ Didn't request this?
                          </p>
                          <p style="margin: 6px 0 0 0; font-size: 12px; color: #a1a1b5; line-height: 1.6;">
                            If you didn't request a password reset, please ignore this email. Your account remains secure and no changes have been made.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- ====== FOOTER ====== -->
          <tr>
            <td style="padding: 32px 20px 0 20px;">

              <!-- Help Text -->
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

              <!-- Divider -->
              <div style="height: 1px; background-color: rgba(255,255,255,0.04); margin-bottom: 16px;"></div>

              <!-- Brand Footer -->
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

              <!-- Links -->
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

              <!-- Copyright -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 0 0 8px 0;">
                    <p style="margin: 0; font-size: 10px; color: #3a3a4e; line-height: 1.5;">
                      &copy; ${currentYear} Theni Jobs. All rights reserved.
                    </p>
                    <p style="margin: 4px 0 0 0; font-size: 10px; color: #3a3a4e; line-height: 1.5;">
                      This is an automated email. Please do not reply.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

        </table>
        <!-- /Email Container -->

      </td>
    </tr>
  </table>

</body>
</html>`;
}

/**
 * Returns a plain-text version of the password reset email for clients
 * that don't support HTML.
 */
export function getPasswordResetEmailText(params: {
  userName: string;
  resetLink: string;
  expiryMinutes?: number;
}): string {
  const { userName, resetLink, expiryMinutes = 15 } = params;
  const currentYear = new Date().getFullYear();

  return `THENI JOBS — Password Reset

Hello ${userName},

We received a request to reset the password for your Theni Jobs account.

Click the link below to reset your password:
${resetLink}

⏱️ This link will expire in ${expiryMinutes} minutes.

If you didn't request a password reset, please ignore this email. Your account remains secure.

---
Need help? Contact us at support@thenijobs.com
© ${currentYear} Theni Jobs — Connecting Talent with Opportunity
https://thenijobs.com
`;
}
