import prisma from "../db/prisma.js";
import crypto from "crypto";

import { Worker, Job } from "bullmq";
import { redis } from "../utils/redis.js";
import { DeliveryQueue } from "../utils/queues.js";


export const eventWorker = new Worker("event-queue", async (job: Job) => {
  console.log(`Processing event job: ${job.id}`)

  const event = job.data;

  await processEvents(event)
}, {
  connection: redis,
  concurrency: 5,
})


export async function processEvents(event: any) {
  try {
    const subscribedWebhooks = await prisma.webhook.findMany({
      where: {
        orgId: event.orgId,
        subscriptions: {
          has: event.type,
        },
      },
    });

    if (subscribedWebhooks.length === 0) {
      await prisma.notification.create({
        data: {
          orgId: event.orgId,
          type: "NO_WEBHOOKS_SUBSCRIBED",
          message: `No webhooks found for event type: ${event.type}`,
          metadata: {
            eventId: event.id,
            eventType: event.type,
          },
        },
      });
      console.log("Notification, no webhooks found for event sent:", event.id);
      return;
    }

    const createdDeliveries = await prisma.delivery.createManyAndReturn({
      data: subscribedWebhooks.map((webhook) => ({
        orgId: event.orgId,
        webhookId: webhook.id,
        eventId: event.id,
        status: "pending",
        attempts: 0,
      })),
    });

    const deliveryQueueItems = createdDeliveries.map((delivery) => {
      const webhook = subscribedWebhooks.find(
        (w) => w.id === delivery.webhookId,
      );
      if (!webhook) {
        console.log("Webhook not found");
        throw new Error("Webhook not found");
      }
      return {
        delivery,
        event,
        webhook,
      };
    });

   const deliveryQueue = await DeliveryQueue.addBulk(
    deliveryQueueItems.map((item) => ({
      name: "delivery",
      data: item,
      opts: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      }
    }))
   )
    console.log("delivery queue", deliveryQueue)
  } catch (error) {
    console.error(error);
  }
}

export const deliveryWorker = new Worker("delivery-queue", async (job: Job)=>{
    const {delivery, event, webhook} = job.data;

    // job.attemptsMade starts at 0 for the first run, so +1 gives us the current attempt number
    await retryWrapper({delivery, event, webhook}, job.attemptsMade + 1)
}, {
    connection: redis,
    concurrency: 5,
})

deliveryWorker.on("failed", async (job, err) => {
  // Check if it's the final failed attempt (max attempts is set to 3)
  if (job && job.attemptsMade >= 3) {
    const { delivery, event, webhook } = job.data;
    
    try {
      await prisma.notification.create({
        data: {
          orgId: delivery.orgId,
          type: "WEBHOOK_DELIVERY_FAILED",
          message: `Webhook delivery failed permanently for event type: ${event.type}`,
          metadata: {
            eventId: event.id,
            webhookId: webhook.id,
            attempts: job.attemptsMade,
            error: err.message,
          },
        },
      });
      console.log("Notification sent: Webhook failed permanently after 3 tries.", delivery.id);
    } catch (dbError) {
      console.error("Failed to create notification", dbError);
    }
  }
});

export async function retryWrapper(job: any, attemptNumber: number) {
  // 1. Generate the HMAC signature
  const signature = crypto
    .createHmac("sha256", job.webhook.secret)
    .update(JSON.stringify(job.event.payload))
    .digest("hex");

  try {
    // 2. Fire the webhook
    const response = await fetch(job.webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Hawk-Signature": signature,
      },
      body: JSON.stringify(job.event.payload),
    });

    // 3. Handle Failure (non-2xx response)
    if (!response.ok) {
      const errorMsg = `Webhook returned status: ${response.status}`;
      
      // Update DB to show this attempt failed
      await prisma.delivery.update({
        where: { id: job.delivery.id },
        data: { status: "failed", attempts: attemptNumber, responseStatus: response.status, error: errorMsg },
      });

      // IMPORTANT: THROW THE ERROR SO BULLMQ KNOWS IT FAILED AND RETRIES LATER!
      throw new Error(errorMsg);
    }

    // 4. Handle Success (2xx response)
    await prisma.delivery.update({
      where: { id: job.delivery.id },
      data: {
        status: "success",
        attempts: attemptNumber,
        responseStatus: response.status,
        error: "",
      },
    });

  } catch (e: any) {
    // If it's the error we just threw manually above, let it bubble up
    if (e.message && e.message.includes("Webhook returned status:")) {
      throw e;
    }

    // Otherwise, this is a network/DNS error. Update the DB then throw.
    await prisma.delivery.update({
      where: { id: job.delivery.id },
      data: { status: "failed", attempts: attemptNumber, error: e.message },
    });
    
    // Bubble up so BullMQ can trigger the backoff/retry
    throw e;
  }
}
