import prisma from "../db/prisma.js";
import { AppError } from "../utils/errors.js";
import { EventQueue } from "../utils/queues.js";
// import { eventsQueue } from "../workers/worker.js";

export const handleEvents = async (
  orgId: string,
  type: string,
  payload: any,
) => {
  try {
    const event = await prisma.event.create({
      data: {
        orgId,
        type,
        payload,
      },
    });

    await EventQueue.add("event", event)

    return event;
  } catch (error) {
    throw error;
  }
};
