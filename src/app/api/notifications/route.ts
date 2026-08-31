import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { notificationPatchSchema, validateBody, safeErrorResponse } from '@/lib/validation';

export async function GET(req: Request) {
  try {
    // SECURITY: Require authentication — notifications are per-user
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    // Only return notifications belonging to the authenticated user
    const notifications = await prisma.notification.findMany({
      where: { userId: auth.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    const unreadCount = notifications.filter((n: any) => !n.isRead).length;

    return NextResponse.json({ notifications, unreadCount });
  } catch (error: any) {
    console.error('Fetch notifications error:', error);
    return safeErrorResponse('Failed to fetch notifications');
  }
}

export async function PATCH(req: Request) {
  try {
    // SECURITY: Require authentication
    const auth = await requireAuth();
    if (auth.error) return auth.error;

    const body = await req.json();

    // Validate input
    const { data, error } = validateBody(notificationPatchSchema, body);
    if (error) return error;

    const { notificationId, markAll } = data;

    if (markAll) {
      // Mark all of the authenticated user's notifications as read
      await prisma.notification.updateMany({
        where: { userId: auth.user.id, isRead: false },
        data: { isRead: true }
      });
    } else if (notificationId) {
      // SECURITY: IDOR fix — verify the notification belongs to the authenticated user
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId }
      });

      if (!notification || notification.userId !== auth.user.id) {
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
      }

      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update notification error:', error);
    return safeErrorResponse('Failed to update notifications');
  }
}