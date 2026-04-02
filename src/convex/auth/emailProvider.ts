export interface EmailProvider {
  sendOtp(email: string, otp: string, appName: string): Promise<void>;
  sendMagicLink(email: string, magicLink: string, appName: string): Promise<void>;
}

export class ResendProvider implements EmailProvider {
  constructor(private apiKey: string) {}

  async sendOtp(email: string, otp: string, appName: string): Promise<void> {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${appName} <noreply@resend.dev>`,
        to: [email],
        subject: `Your ${appName} verification code`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Verification Code</h2>
            <p>Your verification code for ${appName} is:</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
              ${otp}
            </div>
            <p>This code will expire in 15 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send OTP: ${response.statusText}`);
    }
  }

  async sendMagicLink(email: string, magicLink: string, appName: string): Promise<void> {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${appName} <noreply@resend.dev>`,
        to: [email],
        subject: `Sign in to ${appName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Sign in to ${appName}</h2>
            <p>Click the button below to sign in to your account:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${magicLink}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Sign In
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f5f5f5; padding: 10px; border-radius: 4px;">
              ${magicLink}
            </p>
            <p>This link will expire in 15 minutes.</p>
            <p>If you didn't request this link, please ignore this email.</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send magic link: ${response.statusText}`);
    }
  }
}

export class VlyEmailProvider implements EmailProvider {
  constructor(private apiKey: string) {}
  
  async sendOtp(email: string, otp: string, appName: string): Promise<void> {
    const response = await fetch("https://email.vly.ai/send_otp", {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: email,
        otp: otp,
        appName: appName,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send OTP: ${response.statusText}`);
    }
  }

  async sendMagicLink(email: string, magicLink: string, appName: string): Promise<void> {
    const response = await fetch("https://email.vly.ai/send_magic_link", {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: email,
        magicLink: magicLink,
        appName: appName,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send magic link: ${response.statusText}`);
    }
  }
}

// Factory function to create email provider based on environment
export function createEmailProvider(): EmailProvider {
  const provider = process.env.EMAIL_PROVIDER || "vly";
  
  switch (provider) {
    case "resend":
      const resendApiKey = process.env.RESEND_API_KEY;
      if (!resendApiKey) {
        throw new Error("RESEND_API_KEY environment variable is required");
      }
      return new ResendProvider(resendApiKey);
    case "vly":
    default:
      const vlyApiKey = process.env.VLY_API_KEY || process.env.VLY_INTEGRATION_KEY;
      if (!vlyApiKey) {
        throw new Error("VLY_API_KEY or VLY_INTEGRATION_KEY environment variable is required");
      }
      return new VlyEmailProvider(vlyApiKey);
  }
}
