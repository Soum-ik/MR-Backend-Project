import type { Request, Response } from 'express';
import sendResponse from '../../../libs/sendResponse';
import { prisma } from '../../../libs/prismaHelper';
import httpStatus from 'http-status';
import { OrderStatus } from '../Order_page.constant';

export const startProject = async (req: Request, res: Response) => {
    try {
        const reqBody = req.body

        const projectData = await prisma.order.update({
            where: {
                id: reqBody.id
            },
            data: {
                currentStatus: OrderStatus.PROJECT_RUNNING,
            }
        })

        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: 'Project started successfully',
            data: projectData, // Should be replaced with actual project data
        });
    } catch (error) {
        console.error('Error in startProject:', error);
        return sendResponse(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'An error occurred while processing your request',
        });
    }
}