import prisma from "../db/prisma.js";
import { AppError } from "../utils/errors.js";

export interface PaginationOptions {
  limit: number;
  page?: number;
  cursor?: string;
}

/**
 * Builds Prisma pagination object based on options
 */
function buildPagination(options: PaginationOptions): any {
  const { limit, page, cursor } = options;
  if (cursor) {
    return {
      take: limit,
      skip: 1,
      cursor: { id: cursor },
    };
  }
  return {
    take: limit,
    skip: page ? (page - 1) * limit : 0,
    cursor: undefined,
  };
}

export async function getNotificationsService(orgId: string, options: PaginationOptions) {
  try {
    const pagination = buildPagination(options);
    return await prisma.notification.findMany({
      where: { orgId },
      ...pagination,
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    throw error;
  }
}

export async function markNotificationReadService(orgId: string, notificationId: string) {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.orgId !== orgId) {
      throw new AppError("Notification not found", 404);
    }

    return await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  } catch (error) {
    throw error;
  }
}

export async function getDeliveriesService(
  orgId: string,
  options: PaginationOptions,
  filters: { status?: string; eventType?: string; eventId?: string }
) {
  try {
    const pagination = buildPagination(options);
    const { status, eventType, eventId } = filters;

    return await prisma.delivery.findMany({
      where: {
        orgId,
        ...(status && { status }),
        ...(eventId && { eventId }),
        ...(eventType && {
          event: {
            type: eventType,
          },
        }),
      },
      include: {
        event: {
          select: { type: true, payload: true },
        },
        webhook: {
          select: { url: true },
        },
      },
      ...pagination,
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    throw error;
  }
}

export async function getStatsService(orgId: string) {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalEvents, activeWebhooks, totalDeliveries, deliveriesByStatus] = await Promise.all([
      prisma.event.count({ where: { orgId } }),
      prisma.webhook.count({ where: { orgId } }),
      prisma.delivery.count({ where: { orgId } }),
      prisma.delivery.groupBy({
        by: ["status"],
        where: { orgId },
        _count: true,
      }),
    ]);

    const successCount = deliveriesByStatus.find((d) => d.status === "success")?._count || 0;
    const successRate = totalDeliveries > 0 ? (successCount / totalDeliveries) * 100 : 0;

    // Get 7-day history (grouped by day)
    const history = await prisma.delivery.findMany({
      where: {
        orgId,
        createdAt: { gte: sevenDaysAgo },
      },
      select: {
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return {
      overview: {
        totalEvents,
        activeWebhooks,
        totalDeliveries,
        successRate: parseFloat(successRate.toFixed(2)),
      },
      history: history.reduce((acc: any, curr) => {
        const day = curr.createdAt.toISOString().split("T")[0];
        if (!acc[day]) acc[day] = { success: 0, failed: 0 };
        if (curr.status === "success") acc[day].success++;
        else acc[day].failed++;
        return acc;
      }, {}),
    };
  } catch (error) {
    throw error;
  }
}
