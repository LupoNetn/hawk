import express from "express";
import { handleEvents } from "../controllers/events.controller.js";
import { authenticateRequest } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authenticateRequest, handleEvents);



export default router;