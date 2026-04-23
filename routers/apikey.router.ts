import { Router } from "express";
import { handleCreateApiKey, handleGetApiKeys, handleDeleteApiKey } from "../controllers/apikey.controller.js";
import { authenticateDashboard } from "../middleware/auth.middleware.js";

const router = Router();

// These routes are for managing keys via the dashboard (using Cookies)
router.post("/", authenticateDashboard, handleCreateApiKey);
router.get("/", authenticateDashboard, handleGetApiKeys);
router.delete("/:id", authenticateDashboard, handleDeleteApiKey);

export default router;
