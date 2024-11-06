import type { Request, Response } from "express";
import sendResponse from "../../libs/sendResponse";
import httpStatus from "http-status";
import z from "zod/lib";


const getDashboardData = async (req: Request, res: Response) => {
    try {

            

    } catch (error) {
        // Handle validation errors
        if (error instanceof z.ZodError) {
            return sendResponse(res, {
                statusCode: httpStatus.BAD_REQUEST,
                success: false,
                message: 'Validation failed',
                data: error.errors,
            });
        }

        // Handle other errors
        return sendResponse(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Internal server error',
        }); 
    }
};
