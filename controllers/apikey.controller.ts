import { Request, Response } from "express";
import { createApiKey, getApiKeys, deleteApiKey } from "../service/apikey.service.js";
import { AppError } from "../utils/errors.js";

export const handleCreateApiKey = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        if (!name || typeof name !== "string") {
            throw new AppError("API key name is required", 400);
        }

        const orgId = (req as any).organization.id;
        const apiKey = await createApiKey(orgId, name);
        console.log(apiKey)

        return res.status(201).json({
            message: "API key created successfully. Please save this key as it will not be shown again.",
            apiKey
        });
    } catch (error: any) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        return res.status(500).json({ message: "Internal server error", error: error.message});
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

export const handleDeleteApiKey = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const strId = id.toString();
        const orgId = (req as any).organization.id;

        await deleteApiKey(orgId, strId);

        return res.status(200).json({
            message: "API key deleted successfully"
        });
    } catch (error: any) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        return res.status(500).json({ message: "Internal server error" });
    }
}
