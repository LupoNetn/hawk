import jwt from 'jsonwebtoken';
import { AppError } from './errors.js';

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || '';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || '';

export function generateAccessToken(payload: { id: string, email: string }) {
    return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' });
}

export function generateRefreshToken(payload: { id: string, email: string }) {
    return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string) {
    try {
        return jwt.verify(token, ACCESS_SECRET) as { id: string, email: string };
    } catch (error) {
        throw new AppError("Invalid or expired access token", 401);
    }
}

export function verifyRefreshToken(token: string) {
    try {
        return jwt.verify(token, REFRESH_SECRET) as { id: string, email: string };
    } catch (error) {
        throw new AppError("Invalid or expired refresh token", 401);
    }
}
