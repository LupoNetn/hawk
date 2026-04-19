import prisma from "../db/prisma.js";
import crypto from "crypto";

export const eventsQueue: any[] = [];
export const deliveryQueue: any[] = [];

export async function processEventsQueue() {
 while(true){
    if(eventsQueue.length > 0){
        const event = eventsQueue.shift();
        await processEvents(event);
    } else {
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
 }
}

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

    deliveryQueue.push(...deliveryQueueItems);
  } catch (error) {
    console.error(error);
  }
}

export async function processDeliveryQueue() {
 while(true){
    if(deliveryQueue.length > 0){
        const delivery = deliveryQueue.shift();
        await retryWrapper(delivery);
    } else {
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
 }
}

export async function retryWrapper(delivery: any) {
  let attempts = 0;
  let isSuccess = false;
  let responseStatus = 0;
  let error = "";

  while (attempts < 4) {
    if (isSuccess) break;

    attempts++;
    try {
      // 1. Generate the HMAC signature
      const signature = crypto
        .createHmac("sha256", delivery.webhook.secret)
        .update(JSON.stringify(delivery.event.payload))
        .digest("hex");

      const response = await fetch(delivery.webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Hawk-Signature": signature,
        },
        body: JSON.stringify(delivery.event.payload),
      });

      if (!response.ok) {
        error = `Webhook returned status: ${response.status}`;
        responseStatus = response.status;
 
        // Update DB on Every Failure
        await prisma.delivery.update({
          where: { id: delivery.id },
          data: { status: "failed", attempts, responseStatus, error },
        });

        const delay = Math.min(1000 * Math.pow(2, attempts - 1), 60000);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      isSuccess = true;

      // Update DB on Success
      await prisma.delivery.update({
        where: { id: delivery.id },
        data: {
          status: "success",
          attempts,
          responseStatus: response.status,
          error: "",
        },
      });
    } catch (e: any) {
      error = e.message;

      // Update DB on Exception (broken URL, DNS fail, etc.)
      await prisma.delivery.update({
        where: { id: delivery.id },
        data: { status: "failed", attempts, error },
      });

      const delay = Math.min(1000 * Math.pow(2, attempts - 1), 60000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  if (!isSuccess) {
    await prisma.notification.create({
      data: {
        orgId: delivery.orgId,
        type: "WEBHOOK_DELIVERY_FAILED",
        message: `Webhook delivery failed for event type: ${delivery.event.type}`,
        metadata: {
          eventId: delivery.event.id,
          webhookId: delivery.webhook.id,
          attempts,
          error,
        },
      },
    });
    console.log("Notification, webhook delivery failed sent:", delivery.id);
  }
}
