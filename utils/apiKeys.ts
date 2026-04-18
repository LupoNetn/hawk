import crypto from 'crypto';

export function generateAndHashApiKey() {
    const prefix = "hk_live_";
    const random = crypto.randomBytes(32).toString("hex");
    const apiKey = prefix + random;

    const hashedKey = crypto.createHash("sha256").update(apiKey).digest("hex");

    return {apiKey, hashedKey};

}

export function verifyApiKey(apiKey: string, hashedKey: string) {
    const hashed = crypto.createHash("sha256").update(apiKey).digest("hex");
    return hashed === hashedKey;
}
