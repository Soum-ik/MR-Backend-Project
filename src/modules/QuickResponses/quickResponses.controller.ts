import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import { prisma } from '../../libs/prismaHelper';
import sendResponse from '../../libs/sendResponse';


// Create a new Quick Response
const createQuickResquickResponse = async (req: Request, res: Response) => {
    try {
        const { user_id }: any = req.user
        if (!user_id) {
            return sendResponse<any>(res, { statusCode: httpStatus.NOT_FOUND, success: false, message: 'Token are required!', })
        }

        const { title, description } = req.body;

        // Validate the required fields
        if (!title || !description) {
            return sendResponse(res, {
                statusCode: httpStatus.BAD_REQUEST,
                success: false,
                message: 'Title, description, and userId are required',
            });
        }

        // Create a new QuickResquickResponse
        const quickResponse = await prisma.quickResponse.create({
            data: {
                title,
                description,
                userId: user_id
            },
        });

        return sendResponse(res, {
            statusCode: httpStatus.CREATED,
            success: true,
            message: 'Quick Response created successfully',
            data: quickResponse,
        });
    } catch (error) {
        console.error('Create QuickResquickResponse Error:', error);
        return sendResponse(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Internal server error',
        });
    }
};

// Update an existing Quick Response
const updateQuickResquickResponse = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title, description } = req.body;

        // Validate the required fields
        if (!id || (!title && !description)) {
            return sendResponse(res, {
                statusCode: httpStatus.BAD_REQUEST,
                success: false,
                message: 'Invalid request data',
            });
        }

        // Update the QuickResquickResponse entry
        const quickResponse = await prisma.quickResponse.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(description && { description }),
            },
        });

        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: 'Quick Response updated successfully',
            data: quickResponse,
        });
    } catch (error) {
        console.error('Update QuickResquickResponse Error:', error);
        if (error === 'P2025') { // Prisma error for record not found
            return sendResponse(res, {
                statusCode: httpStatus.NOT_FOUND,
                success: false,
                message: 'Quick Response not found',
            });
        }
        return sendResponse(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Internal server error',
        });
    }
};

// Delete a Quick Response
const deleteQuickResquickResponse = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Validate the ID
        if (!id) {
            return sendResponse(res, {
                statusCode: httpStatus.BAD_REQUEST,
                success: false,
                message: 'Invalid request data',
            });
        }

        // Delete the QuickResquickResponse entry
        await prisma.quickResponse.delete({
            where: { id },
        });

        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: 'Quick Response deleted successfully',
        });
    } catch (error) {
        console.error('Delete QuickResquickResponse Error:', error);
        if (error === 'P2025') { // Prisma error for record not found
            return sendResponse(res, {
                statusCode: httpStatus.NOT_FOUND,
                success: false,
                message: 'Quick Response not found',
            });
        }
        return sendResponse(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Internal server error',
        });
    }
};

// Get all Quick Responses for a user
const getUserQuickResquickResponse = async (req: Request, res: Response) => {
    try {
        const { user_id }: any = req.user
        if (!user_id) {
            return sendResponse<any>(res, { statusCode: httpStatus.NOT_FOUND, success: false, message: 'Token are required!', })
        }

        // Fetch QuickResquickResponse entries for the user
        const quickResponseponses = await prisma.quickResponse.findMany({
            where: { userId: user_id }
        });

        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: 'Quick Responses retrieved successfully',
            data: quickResponseponses,
        });
    } catch (error) {
        console.error('Get QuickResquickResponse Error:', error);
        return sendResponse(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Internal server error',
        });
    }
};


export const quickResponse = {
    createQuickResquickResponse,
    updateQuickResquickResponse,
    deleteQuickResquickResponse,
    getUserQuickResquickResponse,
}