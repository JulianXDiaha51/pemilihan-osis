import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getDb } from './db';

const COOKIE_NAME = 'osis_session';
const MAX_AGE = 60 * 60 * 24 * 7;

export interface SessionPayload {
  sub: string;
  username: string;
  role: 'admin' | 'user';
}

export interface CurrentUser {
  id: string;
  username: string;
  role: 'admin' | 'user';
  nama_lengkap: string;
  kelas: string;
  sudah_vote: boolean;
}

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('JWT_SECRET belum di-set atau terlalu pendek di .env.local');
  }
  return secret;
}

export function signToken(payload: SessionPayload) {
  return jwt.sign(payload, getSecret(), { expiresIn: MAX_AGE });
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, getSecret()) as SessionPayload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getSessionPayload(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const payload = await getSessionPayload();
  if (!payload) return null;

  const row = getDb()
    .prepare(
      `SELECT id, username, role, nama_lengkap, kelas, sudah_vote
       FROM users WHERE id = ?`
    )
    .get(payload.sub) as
    | {
        id: string;
        username: string;
        role: 'admin' | 'user';
        nama_lengkap: string;
        kelas: string;
        sudah_vote: number;
      }
    | undefined;

  if (!row) return null;
  return { ...row, sudah_vote: row.sudah_vote === 1 };
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError('Unauthorized', 401);
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== 'admin') throw new AuthError('Forbidden - admin only', 403);
  return user;
}

export class AuthError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}
