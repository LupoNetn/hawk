import prisma from "../db/prisma.js";
import { generateAndHashApiKey } from "../utils/apiKeys.js";
import { AppError } from "../utils/errors.js";

export async function createApiKey(orgId: string, name: string) {
    try {
        const { apiKey, hashedKey } = generateAndHashApiKey();
        
        const createdKey = await prisma.apiKey.create({
            data: {
                orgId,
                name,
                keyHash: hashedKey
            }
        });

        // Return the plain text key exactly once
        return apiKey;
    } catch (error) {
        throw error;
        //throw new AppError("Failed to create API key", 500);
    }
}

export async function getApiKeys(orgId: string) {
    try {
        const keys = await prisma.apiKey.findMany({
            where: { orgId },
            orderBy: { createdAt: 'desc' }
        });
        
        return keys.map(k => ({
            id: k.id,
            name: k.name,
            keyHash: `hk_live_...${k.keyHash.slice(-6)}`,
            createdAt: k.createdAt
        }));
    } catch (error) {
        throw new AppError("Failed to fetch API keys", 500);
    }
}

export async function deleteApiKey(orgId: string, id: string) {
    try {
        return await prisma.apiKey.deleteMany({
            where: {
                id,
                orgId
            }
        });
    } catch (error) {
        throw new AppError("Failed to delete API key", 500);
    }
}
