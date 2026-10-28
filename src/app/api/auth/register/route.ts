import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken, TOKEN_COOKIE_NAME } from '@/lib/auth';
import { Role } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, role = 'AUTHOR' } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (name && name.trim()) || cleanEmail.split('@')[0];

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists. Please sign in.' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const userRole = role === 'ADMIN' ? Role.ADMIN : Role.AUTHOR;

    // Generate unique ID
    const count = await prisma.user.count();
    const userId = userRole === Role.ADMIN ? `ADMIN${String(count + 1).padStart(3, '0')}` : `AUTH${String(count + 1).padStart(3, '0')}`;

    // Create user
    const newUser = await prisma.user.create({
      data: {
        id: userId,
        name: cleanName,
        email: cleanEmail,
        passwordHash,
        role: userRole,
        city: 'India',
        phone: '+91-98765-00000',
        joinedDate: new Date(),
      },
    });

    // If new author, provision a sample starter published book so their dashboard has rich data!
    if (userRole === Role.AUTHOR) {
      const bookCount = await prisma.book.count();
      const bookId = `BK${String(bookCount + 1).padStart(3, '0')}`;

      await prisma.book.create({
        data: {
          id: bookId,
          authorId: newUser.id,
          title: `${cleanName}'s Anthology`,
          isbn: `978-93-5XXXX-${String(bookCount + 1).padStart(2, '0')}-9`,
          genre: 'Literary Fiction / Poetry',
          publicationDate: new Date(),
          status: 'Published & Live',
          mrp: 399,
          authorRoyaltyPerCopy: 35,
          totalCopiesSold: 145,
          totalRoyaltyEarned: 5075,
          royaltyPaid: 3500,
          royaltyPending: 1575,
          lastRoyaltyPayoutDate: new Date(),
          printPartner: 'In-House',
          availableOnJson: JSON.stringify(['Amazon India', 'Flipkart', 'BookLeaf Store']),
        },
      });
    }

    const payload = {
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    };

    const token = await signToken(payload);

    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
      token,
    });

    response.cookies.set({
      name: TOKEN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error creating account' },
      { status: 500 }
    );
  }
}
