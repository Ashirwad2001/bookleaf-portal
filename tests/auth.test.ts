import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode('bookleaf-secret-jwt-key-2026-production-ready');

describe('Unit Tests: Authentication & Security', () => {
  test('Password hashing and verification with bcrypt', async () => {
    const rawPassword = 'authorPassword123!';
    const hash = await bcrypt.hash(rawPassword, 10);

    assert.notEqual(rawPassword, hash, 'Hash must not equal plaintext');
    const isValid = await bcrypt.compare(rawPassword, hash);
    assert.equal(isValid, true, 'Valid password must compare to true');

    const isInvalid = await bcrypt.compare('wrongPassword', hash);
    assert.equal(isInvalid, false, 'Invalid password must compare to false');
  });

  test('JWT creation, signing, and verification', async () => {
    const payload = {
      userId: 'AUTH001',
      email: 'priya.sharma@email.com',
      name: 'Priya Sharma',
      role: 'AUTHOR',
    };

    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    assert.ok(token, 'Token string must be generated');
    assert.equal(typeof token, 'string');

    const verified = await jwtVerify(token, JWT_SECRET);
    assert.equal(verified.payload.userId, 'AUTH001');
    assert.equal(verified.payload.email, 'priya.sharma@email.com');
    assert.equal(verified.payload.role, 'AUTHOR');
  });

  test('JWT verification fails with wrong secret', async () => {
    const token = await new SignJWT({ userId: 'ADMIN001', role: 'ADMIN' })
      .setProtectedHeader({ alg: 'HS256' })
      .sign(JWT_SECRET);

    const wrongSecret = new TextEncoder().encode('wrong-secret-key-12345');
    await assert.rejects(
      async () => {
        await jwtVerify(token, wrongSecret);
      },
      /signature/i
    );
  });
});
