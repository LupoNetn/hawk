import { Request, Response } from "express";
import { createWebhook, getWebhooks, getWebhookById, deleteWebhook } from "../service/webhook.service.js";
import { AppError } from "../utils/errors.js";
import validator from "validator";

export const handleCreateWebhook = async (req: Request, res: Response) => {
    try {
        const {url, subscriptions} = req.body
        const orgId = (req as any).organization.id;

        if (!url || !subscriptions) {
            throw new AppError("URL and Subscriptions are required", 400);
        }

        if (!validator.isURL(url, { require_protocol: true, protocols: ['http', 'https'] })) {
            throw new AppError("Invalid webhook URL. Please include http:// or https://", 400);
        }

        if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
            throw new AppError("Subscriptions must be a non-empty array", 400);
        }

        const webhook = await createWebhook(orgId, url, subscriptions)

        return res.status(201).json(
            {
                message: "Webhook created successfully",
                webhook, 
                secret: webhook.secret,
            })
    } catch (error: any) {
        console.log("Error in creating webhook", error)
        if(error instanceof AppError) {
            return res.status(error.statusCode).json({message: error.message})
        }
        return res.status(500).json({message: "Internal server error"})
    }
}

export const handleGetWebhooks = async (req: Request, res: Response) => {
    try {
        const orgId = (req as any).organization.id;
        const webhooks = await getWebhooks(orgId);

        return res.status(200).json({
            message: "Webhooks retrieved successfully",
            data: webhooks
        });
    } catch (error: any) {
        if(error instanceof AppError) {
            return res.status(error.statusCode).json({message: error.message})
        }
        return res.status(500).json({message: "Internal server error"})
    }
}

export const handleGetWebhookById = async (req: Request, res: Response) => {
    try {
        const orgId = (req as any).organization.id;
        const id = req.params.id as string;
        const webhook = await getWebhookById(orgId, id);

        return res.status(200).json({
            message: "Webhook retrieved successfully",
            data: webhook
        });
    } catch (error: any) {
        if(error instanceof AppError) {
            return res.status(error.statusCode).json({message: error.message})
        }
        return res.status(500).json({message: "Internal server error"})
    }
}

export const handleDeleteWebhook = async (req: Request, res: Response) => {
    try {
        const orgId = (req as any).organization.id;
        const id = req.params.id as string;
        await deleteWebhook(orgId, id);

        return res.status(200).json({
            message: "Webhook deleted successfully"
        });
    } catch (error: any) {
        if(error instanceof AppError) {
            return res.status(error.statusCode).json({message: error.message})
        }
        return res.status(500).json({message: "Internal server error"})
    }
}