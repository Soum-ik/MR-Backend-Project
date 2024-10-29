import type { Request, Response } from 'express';
import sendResponse from '../../../libs/sendResponse';
import { prisma } from '../../../libs/prismaHelper';
import httpStatus from 'http-status';

export const startProject = async (req: Request, res: Response) => {
    try {
      
        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: 'Project started successfully',
            data: {}, // Should be replaced with actual project data
        });
    } catch (error) {
        return sendResponse(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Failed to start project',
            data: error instanceof Error ? error.message : String(error),
        });
    }
}