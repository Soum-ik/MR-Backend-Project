import type { Request, Response } from 'express';
import sendResponse from '../../../libs/sendResponse';
import { prisma } from '../../../libs/prismaHelper';
import httpStatus from 'http-status';

export const startProject = async (req: Request, res: Response) => {
    const {} = req.body
   
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Project started successfully',
        data: {}, // Should be replaced with actual project data
    });

}