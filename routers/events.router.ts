import express from "express";
import { handleEvents } from "../controllers/events.controller.js";
import { authenticateApiKey } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authenticateApiKey, handleEvents);



export default router;