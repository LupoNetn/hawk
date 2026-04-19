import { Router } from "express";
import { handleCreateWebhook, handleGetWebhooks, handleGetWebhookById, handleDeleteWebhook } from "../controllers/webhook.controller.js";
import { authenticateRequest } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", authenticateRequest, handleCreateWebhook);
router.get("/", authenticateRequest, handleGetWebhooks);
router.get("/:id", authenticateRequest, handleGetWebhookById);
router.delete("/:id", authenticateRequest, handleDeleteWebhook);

export default router;