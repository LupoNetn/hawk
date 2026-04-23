import { Request, Response } from "express";
import { handleEvents as handleEventsService } from "../service/events.service.js";
import { AppError } from "../utils/errors.js";

export const handleEvents = async (req: Request, res: Response) => {
  try {
    const { type, payload } = req.body;
    if (!type || !payload) {
      return res.status(400).json({ message: "Invalid request" });
    }
    const orgId = (req as any).organization.id;

    const event = await handleEventsService(orgId, type, payload);

    if (!event) {
        return res.status(500).json({ message: "Failed to process event" });
    }
    
    return res.status(200).json({ message: "Event has been created and is currently undergoing processing", eventId: event.id});
  } catch (error: any) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
