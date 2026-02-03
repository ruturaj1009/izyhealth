import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key_change_this_in_prod';

export async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export function signToken(payload: any, expiresIn: string | number = '30m'): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn as any });
}

export function signRefreshToken(payload: any): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): any {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

export function verifyRefreshToken(token: string): any {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

export function generateOrgId(): number {
    return Math.floor(100000 + Math.random() * 900000);
}

export function generateSPID(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export async function authorize(req: Request) {
    const authHeader = req.headers.get('authorization');
    const orgIdHeader = req.headers.get('x-org-id');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Unauthorized: Missing token');
    }

    if (!orgIdHeader) {
        throw new Error('Unauthorized: Missing Organization ID header');
    }

    const token = authHeader.split(' ')[1];
    const decoded: any = verifyToken(token);

    if (!decoded) {
        throw new Error('Unauthorized: Invalid token');
    }

    // Check if user belongs to the requested Org
    // Note: OrgID in header is string, tokens usually number. Compare safely.
    if (String(decoded.orgid) !== String(orgIdHeader)) {
        throw new Error('Forbidden: Access denied for this organization');
    }

    return decoded;
}
