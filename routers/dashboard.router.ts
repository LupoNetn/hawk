import { Router } from "express";
import { handleGetNotifications, handleMarkNotificationRead, handleGetDeliveries, handleGetStats } from "../controllers/dashboard.controller.js";
import { authenticateDashboard } from "../middleware/auth.middleware.js";

const router = Router();

// Retrieve paginated notifications
router.get("/notifications", authenticateDashboard, handleGetNotifications);

// Mark a specific notification as read
router.patch("/notifications/:id/read", authenticateDashboard, handleMarkNotificationRead);

// Retrieve paginated and filtered deliveries
router.get("/deliveries", authenticateDashboard, handleGetDeliveries);

// Retrieve full dashboard stats
router.get("/stats", authenticateDashboard, handleGetStats);

export default router;
