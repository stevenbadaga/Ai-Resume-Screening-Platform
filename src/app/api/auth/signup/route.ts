import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, organization } = await req.json();

    if (!name || !email || !password || !organization) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
    }

    // Create organization and user in a transaction
    const newUser = await prisma.$transaction(async (tx) => {
      // 1. Create Organization
      const org = await tx.organization.create({
        data: {
          name: organization
        }
      });

      // 2. The first user to register an organization is the owner/Admin
      const role = await tx.role.create({
        data: {
          name: 'Admin',
          permissions: ['ALL']
        }
      });

      // 3. Create User
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash: password,
          organizationId: org.id,
          roles: {
            connect: { id: role.id }
          }
        }
      });

      // 4. Set the Primary Owner
      await tx.organization.update({
        where: { id: org.id },
        data: { primaryOwnerId: user.id }
      });

      return user;
    });

    return NextResponse.json({ success: true, userId: newUser.id }, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error during signup' }, { status: 500 });
  }
}
