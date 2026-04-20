import { Request, Response } from "express";
import { createApiKey, getApiKeys } from "../service/apikey.service.js";
import { AppError } from "../utils/errors.js";

export const handleCreateApiKey = async (req: Request, res: Response) => {
    try {
        const orgId = (req as any).organization.id;
        const apiKey = await createApiKey(orgId);

        return res.status(201).json({
            message: "API key created successfully. Please save this key as it will not be shown again.",
            apiKey
        });
    } catch (error: any) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const handleGetApiKeys = async (req: Request, res: Response) => {
    try {
        const orgId = (req as any).organization.id;
        const keys = await getApiKeys(orgId);

        return res.status(200).json({
            message: "API keys retrieved successfully",
            data: keys
        });
    } catch (error: any) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        return res.status(500).json({ message: "Internal server error" });
    }
}
