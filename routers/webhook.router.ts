import { Router } from "express";
import { handleCreateWebhook, handleGetWebhooks, handleGetWebhookById, handleDeleteWebhook } from "../controllers/webhook.controller.js";
import { authenticateDashboard } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", authenticateDashboard, handleCreateWebhook);
router.get("/", authenticateDashboard, handleGetWebhooks);
router.get("/:id", authenticateDashboard, handleGetWebhookById);
router.delete("/:id", authenticateDashboard, handleDeleteWebhook);

export default router;