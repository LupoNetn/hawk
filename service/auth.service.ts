import prisma from "../db/prisma.js";
import { AppError } from "../utils/errors.js";
import bcrypt from "bcrypt";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";

export async function signUpService(name: string, email: string, password: string, hashedKey: string) {
   try {

    const existingUser = await prisma.organization.findUnique({
        where: {
            email
        }
    })

    if (existingUser) {
        throw new AppError("User already exists", 409);
    }

    const createdOrganizer = await prisma.organization.create({
        data: {
            name,
            email,
            password,
            apiKeys: {
                create: {
                    name: "Default",
                    keyHash: hashedKey
                }
            }
        }
    })

    const responseData = {
        id: createdOrganizer.id,
        name: createdOrganizer.name,
        email: createdOrganizer.email,
        createdAt: createdOrganizer.createdAt,
        updatedAt: createdOrganizer.updatedAt
    }

    return responseData;
   } catch (error: any) {
    if (error.code === 'P2002') {
        throw new AppError("User already exists", 409);
    }
    throw error;
   }
}

export async function signInService(email: string, password: string) {
    try {
        const user = await prisma.organization.findUnique({
            where: {
                email
            }
        })

        if (!user) {
            throw new AppError("User not found", 404);
        }
        
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new AppError("Invalid password", 401);
        }

        const accessToken = generateAccessToken({ id: user.id, email: user.email });
        const refreshToken = generateRefreshToken({ id: user.id, email: user.email });

        const responseData = {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            accessToken,
            refreshToken
        }

        return responseData;
    } catch (error: any) {
        throw error;
    }
}