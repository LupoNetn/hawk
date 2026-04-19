import crypto from "crypto";
import prisma from "../db/prisma.js";
import { AppError } from "../utils/errors.js";

export async function createWebhook(orgId: string, url: string, subscriptions: string[]) {
    try {
        const existingWebhook = await prisma.webhook.findFirst({
            where: {
                orgId,
                url,
            },
        });

        if(existingWebhook) {
            throw new AppError("Webhook already exists", 409);
        }
        const secret = crypto.randomBytes(32).toString("hex");
        const webhook = await prisma.webhook.create({
            data: {
                orgId,
                url,
                subscriptions,
                secret,
            },
        });

        if(!webhook) {
            throw new AppError("Webhook creation failed", 500);
        }
        return webhook;
    } catch (error) {
            throw error;
        
    }
}

export async function getWebhooks(orgId: string) {
    try {
        return await prisma.webhook.findMany({
            where: {
                orgId,
            },
        });
    } catch (error) {
        throw error;
    }
}

export async function getWebhookById(orgId: string, id: string) {
    try {
        const webhook = await prisma.webhook.findUnique({
            where: {
                id,
            },
        });

        if (!webhook || webhook.orgId !== orgId) {
            throw new AppError("Webhook not found", 404);
        }

        return webhook;
    } catch (error) {
        throw error;
    }
}

export async function deleteWebhook(orgId: string, id: string) {
    try {
        // Verify ownership before deleting
        await getWebhookById(orgId, id);

        return await prisma.webhook.delete({
            where: {
                id,
            },
        });
    } catch (error) {
        throw error;
    }
}