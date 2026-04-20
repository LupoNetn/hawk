import { Request, Response } from "express";
import { getNotificationsService, markNotificationReadService, getDeliveriesService, getStatsService, PaginationOptions } from "../service/dashboard.service.js";
import { AppError } from "../utils/errors.js";

// Helper to extract pagination options from request
const getPaginationOptions = (req: Request): PaginationOptions => {
  const limit = parseInt(req.query.limit as string) || 10;
  const page = req.query.page ? parseInt(req.query.page as string) : undefined;
  const cursor = req.query.cursor as string | undefined;
  return { limit, page, cursor };
};

export const handleGetNotifications = async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).organization.id;
    const options = getPaginationOptions(req);
    
    const notifications = await getNotificationsService(orgId, options);
    
    return res.status(200).json({
      message: "Notifications retrieved successfully",
      data: notifications,
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const handleMarkNotificationRead = async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).organization.id;
    const id = req.params.id as string;
    
    const notification = await markNotificationReadService(orgId, id);
    
    return res.status(200).json({
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const handleGetDeliveries = async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).organization.id;
    const options = getPaginationOptions(req);
    
    const filters = {
      status: req.query.status as string | undefined,
      eventType: req.query.eventType as string | undefined,
      eventId: req.query.eventId as string | undefined,
    };
    
    const deliveries = await getDeliveriesService(orgId, options, filters);
    
    return res.status(200).json({
      message: "Deliveries retrieved successfully",
      data: deliveries,
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const handleGetStats = async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).organization.id;
    const stats = await getStatsService(orgId);
    
    return res.status(200).json({
      message: "Stats retrieved successfully",
      data: stats,
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};
