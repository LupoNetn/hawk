import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors.js";
import { verifyAccessToken } from "../utils/jwt.js";
import prisma from "../db/prisma.js";
import crypto from "crypto";

/**
 * Middleware for Dashboard actions (using Browser Cookies)
 */
export const authenticateDashboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.cookies.accessToken;
      if (!token) {
        throw new AppError("Unauthorized. Please log in.", 401);
      }  

      const decodedToken = verifyAccessToken(token);
      (req as any).organization = decodedToken;
      next();
    } catch (error: any) {
        if (error instanceof AppError) {
           return res.status(error.statusCode).json({ message: error.message });
        }
        return res.status(401).json({ message: "Invalid or expired session. Please log in again." });
    }
}

/**
 * Middleware for Developer actions (using Authorization Header)
 */
export const authenticateApiKey = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new AppError("Unauthorized. Please provide an API key in the Authorization header (Bearer <key>).", 401);
      }

      const apiKey = authHeader.split(" ")[1];
      const hashedKey = crypto.createHash("sha256").update(apiKey).digest("hex");
      
      const keyRecord = await prisma.apiKey.findFirst({
          where: { keyHash: hashedKey },
          select: {
              organization: {
                  select: {
                      id: true,
                      email: true,
                      name: true
                  }
              }
          }
      });

      if (!keyRecord) {
          throw new AppError("Invalid API Key.", 401);
      }

      (req as any).organization = keyRecord.organization;
      next();
    } catch (error: any) {
        if (error instanceof AppError) {
           return res.status(error.statusCode).json({ message: error.message });
        }
        return res.status(401).json({ message: "Authentication failed. Check your API key." });
    }
}
