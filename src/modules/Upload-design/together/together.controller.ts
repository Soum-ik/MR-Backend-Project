import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import { prisma } from '../../../libs/prismaHelper';
import sendResponse from '../../../libs/sendResponse';
import { z } from 'zod';


const getByNameSchema = z.object({
    design: z.union([z.string(), z.array(z.string())]),
    industry: z.union([z.string(), z.array(z.string())]),
});

const getTogether = async (req: Request, res: Response) => {
    try {
        // Validate the query using Zod
        let { design, industry } = getByNameSchema.parse(req.query);

        // Ensure that name is an array, even if a single string is passed
        if (typeof design === 'string') {
            design = [design]; // Convert single string to an array
        }
        if (typeof industry === 'string') {
            industry = [industry]; // Convert single string to an array
        }


        const data = await prisma.uploadDesign.findMany({
            where: {
                designs: design ? { hasSome: design } : undefined,
                industrys: industry ? { hasSome: industry } : undefined,
            },
        });


        if (data.length === 0) {
            return sendResponse<any>(res, {
                statusCode: httpStatus.OK,
                success: true,
                data: null,
                message: `data are not found`,
            });
        }
        return sendResponse<any>(res, {
            statusCode: httpStatus.OK,
            success: true,
            data: data,
            message: `Data get successfully`,
        });

    } catch (error) {
        console.error('Error in getTogether:', error);

        if (error instanceof z.ZodError) {
            return sendResponse<any>(res, {
                statusCode: httpStatus.BAD_REQUEST,
                success: false,
                data: null,
                message: `Validation error: ${error.errors.map(e => e.message).join(', ')}`,
            });
        }

        return sendResponse<any>(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            data: null,
            message: `Internal server error. Please try again later.`,
        });
    }
};

export const getTogetherController = {
    getTogether,
};
