import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import { prisma } from '../../libs/prismaHelper';
import sendResponse from '../../libs/sendResponse';
import { z } from 'zod';
import { formSchema } from './contact.validation';


// Define the User interface
interface User {
    user_id?: string;
    role?: string;
    email?: string;
    iat?: number;
    exp?: number;
}

// Extend the Request interface to include the user property
interface AuthenticatedRequest extends Request {
    user?: User;
}


const startContact = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const validatedBody = formSchema.parse(req.body);

        if (!req.user || !req.user.email || !req.user.user_id) {
            return sendResponse<any>(res, {
                statusCode: httpStatus.BAD_REQUEST,
                success: false,
                message: 'User information is missing or userId is required',
            });
        }

        const {  user_id } = req.user;

        const data = await prisma.contactForChat.create({
            data: {
                email: validatedBody.email,
                message: validatedBody.message,
                exampleDesign: validatedBody.exampleDesign,
                name: validatedBody.name,
                website: validatedBody.websiteOrFacebook,
                userId: user_id, // Ensured that user_id is a valid string
            }
        });

        return sendResponse<any>(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: 'Contact created successfully',
            data: data
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return sendResponse(res, {
                statusCode: httpStatus.BAD_REQUEST,
                success: false,
                message: 'Validation failed',
                data: null
            });
        }

        return sendResponse(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Internal server error',
        });
    }
};

export {
    startContact
}