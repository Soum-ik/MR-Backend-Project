import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import { prisma } from '../../../libs/prismaHelper';
import sendResponse from '../../../libs/sendResponse';
import { z } from 'zod';


const getByNameSchema = z.object({
    name: z.union([z.string(), z.array(z.string())]),
});

const getByname = async (req: Request, res: Response) => {
    try {
        // Validate the query using Zod
        let { name } = getByNameSchema.parse(req.query);

        // Ensure that name is an array, even if a single string is passed
        if (typeof name === 'string') {
            name = [name]; // Convert single string to an array
        }

        // Use Prisma to find records where the industrys array contains any of the values in the name array
        const findByName = await prisma.uploadDesign.findMany({
            where: {
                industrys: {
                    hasSome: name, // This filters for records where industrys contains any of the values in the name array
                },
            },
            orderBy: { id: 'desc' }
        });

        if (findByName.length === 0) {
            return sendResponse<any>(res, {
                statusCode: httpStatus.NOT_FOUND,
                success: false,
                data: null,
                message: `Industry not found`,
            });
        }

        return sendResponse<any>(res, {
            statusCode: httpStatus.OK,
            success: true,
            data: findByName,
            message: `Industry retrieved successfully`,
        });

    } catch (error) {
        console.error(error);

        if (error instanceof z.ZodError) {
            return sendResponse<any>(res, {
                statusCode: httpStatus.BAD_REQUEST,
                success: false,
                data: null,
                message: `Validation error: ${error.message}`,
            });
        }

        return sendResponse<any>(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            data: null,
            message: `Internal server error`,
        });
    }
};

const getAll = async (req: Request, res: Response) => {
    try {
        // Fetch all folders from the database
        const findAll = await prisma.industrys.findMany({ select: { name: true }, orderBy: { id: 'desc' } });

        // Send success response with retrieved data
        return sendResponse<any>(res, {
            statusCode: httpStatus.OK,
            success: true,
            data: findAll,
            message: `Folders retrieved successfully`,
        });

    } catch (error) {
        console.error('Error fetching folders:', error);

        // Handle validation errors
        if (error instanceof z.ZodError) {
            return sendResponse<any>(res, {
                statusCode: httpStatus.BAD_REQUEST,
                success: false,
                data: null,
                message: `Validation error: ${error.message}`,
            });
        }

        // Handle other types of errors
        return sendResponse<any>(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            data: null,
            message: `Internal server error`,
        });
    }
}

export const Industrys = {
    getByname, getAll
};
