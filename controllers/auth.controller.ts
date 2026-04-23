import { Request, Response } from "express";
import bcrypt from "bcrypt";
import validator from "validator";
import { generateAndHashApiKey } from "../utils/apiKeys.js";
import { signUpService, signInService } from "../service/auth.service.js";
import { AppError } from "../utils/errors.js";
import { generateAccessToken, verifyRefreshToken } from "../utils/jwt.js";

export const handlerSignUp = async (req: Request, res: Response) => {
    try {
        const {name, email, password} = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long" });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({ message: "Invalid email address" });
        }

        if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
            return res.status(400).json({ message: "Invalid input types" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        //generate api key for organization
        const { apiKey, hashedKey } = generateAndHashApiKey();

        const createdOrganizer = await signUpService(name, email, hashedPassword, hashedKey);

        res.status(201).json({
            message: "Organization created successfully",
            data: {
                ...createdOrganizer,
                apiKey // Return the plain API key once for the user to save
            }
        });
    } catch (error: any) {
        if (error instanceof AppError) {
          return res.status(error.statusCode).json({ message: error.message });
        }
        
        console.log(error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
}


export const handlerSignIn = async (req: Request, res: Response) => {
    try {
        const {email, password} = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long" });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({ message: "Invalid email address" });
        }

        if (typeof email !== "string" || typeof password !== "string") {
            return res.status(400).json({ message: "Invalid input types" });
        }

        const signinResponse: any = await signInService(email, password);

        // Set cookies
        res.cookie("accessToken", signinResponse.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 15 * 60 * 1000 // 15 mins
        });

        res.cookie("refreshToken", signinResponse.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Omit tokens from the response body for security
        const { accessToken, refreshToken, ...userData } = signinResponse;

        res.status(200).json({
            message: "Organization signed in successfully",
            data: userData
        });
    } catch (error: any) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const handlerRefreshToken = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.cookies;

        if (!refreshToken) {
            throw new AppError("Refresh token is required", 400);
        }

        const payload = verifyRefreshToken(refreshToken);
        const accessToken = generateAccessToken({ id: payload.id, email: payload.email });

        // Update the access token cookie
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 15 * 60 * 1000 // 15 mins
        });

        res.status(200).json({
            message: "Token refreshed successfully"
        });
    } catch (error: any) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const handlerLogout = async (req: Request, res: Response) => {
    try {
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");

        res.status(200).json({
            message: "Logged out successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}
export const handlerGetMe = async (req: Request, res: Response) => {
    try {
        const organization = (req as any).organization;
        
        if (!organization) {
            return res.status(401).json({ message: "Not authenticated" });
        }

        res.status(200).json({
            message: "Profile fetched successfully",
            data: organization
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}
