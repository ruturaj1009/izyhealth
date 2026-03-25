import crypto from 'crypto';

const OTP_SECRET = process.env.OTP_SECRET || 'izy-otp-fallback-secret';
const WINDOW_MS = 5 * 60 * 1000; // 5-minute window

// ─── Strategy Interface ────────────────────────────────────────────────────
export interface OtpContext {
    orgid: number;
    spid: string;
}

export interface OtpStrategy {
    /** Generate an OTP for the current time window */
    generate(ctx: OtpContext): string;
    /** Verify an OTP — accepts current & previous window */
    verify(ctx: OtpContext, userOtp: string): boolean;
}

// ─── HMAC Strategy ────────────────────────────────────────────────────────
class HmacOtpStrategy implements OtpStrategy {
    private computeForWindow(ctx: OtpContext, window: number): string {
        const data = `${ctx.orgid}:${ctx.spid}:${window}`;
        const hmac = crypto.createHmac('sha256', OTP_SECRET);
        hmac.update(data);
        const hex = hmac.digest('hex');
        // Convert first 6 hex chars to a 6-digit numeric OTP
        const num = parseInt(hex.slice(0, 8), 16) % 1_000_000;
        return String(num).padStart(6, '0');
    }

    generate(ctx: OtpContext): string {
        const window = Math.floor(Date.now() / WINDOW_MS);
        return this.computeForWindow(ctx, window);
    }

    verify(ctx: OtpContext, userOtp: string): boolean {
        const currentWindow = Math.floor(Date.now() / WINDOW_MS);
        // Accept current and previous window (up to 10 min validity)
        const validOtps = [
            this.computeForWindow(ctx, currentWindow),
            this.computeForWindow(ctx, currentWindow - 1),
        ];
        return validOtps.includes(userOtp.trim());
    }
}

// ─── Factory ──────────────────────────────────────────────────────────────
type OtpStrategyType = 'hmac'; // Extend here: 'sms' | 'totp' | etc.

export class OtpFactory {
    static create(type: OtpStrategyType = 'hmac'): OtpStrategy {
        switch (type) {
            case 'hmac':
                return new HmacOtpStrategy();
            default:
                throw new Error(`Unknown OTP strategy: ${type}`);
        }
    }
}
