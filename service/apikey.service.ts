import prisma from "../db/prisma.js";
import { generateAndHashApiKey } from "../utils/apiKeys.js";
import { AppError } from "../utils/errors.js";

export async function createApiKey(orgId: string) {
    try {
        const { apiKey, hashedKey } = generateAndHashApiKey();
        
        await prisma.apiKey.create({
            data: {
                orgId,
                keyHash: hashedKey
            }
        });

        // Return the plain text key exactly once
        return apiKey;
    } catch (error) {
        throw new AppError("Failed to create API key", 500);
    }
}

export async function getApiKeys(orgId: string) {
    try {
        const keys = await prisma.apiKey.findMany({
            where: { orgId }
        });
        
        // Mask the hashes for the list view
        return keys.map(k => ({
            id: k.id,
            keyHash: `hk_live_...${k.keyHash.slice(-6)}`,
            createdAt: k.createdAt
        }));
    } catch (error) {
        throw new AppError("Failed to fetch API keys", 500);
    }
}
