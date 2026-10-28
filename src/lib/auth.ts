import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import { prisma } from './prisma';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'bookleaf-secret-jwt-key-2026-production-ready'
);
const TOKEN_COOKIE_NAME = 'bookleaf_token';

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: Role;
  [key: string]: unknown;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Extracts authenticated user from request cookie or Authorization header.
 */
export async function getAuthUser(req?: NextRequest): Promise<TokenPayload | null> {
  let token: string | undefined;

  if (req) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    if (!token) {
      token = req.cookies.get(TOKEN_COOKIE_NAME)?.value;
    }
  } else {
    const cookieStore = await cookies();
    token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
  }

  if (!token) return null;
  return verifyToken(token);
}

/**
 * Middleware / helper for API route RBAC protection
 */
export async function requireAuth(
  req: NextRequest,
  allowedRoles?: Role[]
): Promise<{ user: TokenPayload } | { error: NextResponse }> {
  const user = await getAuthUser(req);

  if (!user) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Unauthorized: Authentication required' },
        { status: 401 }
      ),
    };
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error: `Forbidden: Access requires ${allowedRoles.join(' or ')} privileges`,
        },
        { status: 403 }
      ),
    };
  }

  return { user };
}

export { TOKEN_COOKIE_NAME };
