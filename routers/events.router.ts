import express from "express";
import { handleEvents } from "../controllers/events.controller.js";

const router = express.Router();

router.post("/", handleEvents);


export default router;