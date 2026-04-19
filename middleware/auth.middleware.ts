import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors.js";
import { verifyAccessToken } from "../utils/jwt.js";

export const authenticateRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.cookies.accessToken;
      if (!token) {
        throw new AppError("Unauthorized", 401);
      }  

      const decodedToken = verifyAccessToken(token);
      (req as any).organization = decodedToken;
      next();
    } catch (error: any) {
        if (error instanceof AppError) {
           return res.status(error.statusCode).json({ message: error.message });
        }
        return res.status(401).json({ message: "Invalid or expired session" });
    }
}
