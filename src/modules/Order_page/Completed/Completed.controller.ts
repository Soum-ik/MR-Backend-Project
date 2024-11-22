import type { Request, Response } from 'express';
import { prisma } from '../../../libs/prismaHelper';
import httpStatus from 'http-status';
import sendResponse from '../../../libs/sendResponse';
import catchAsync from '../../../libs/utlitys/catchSynch';


export const CompletedProject = catchAsync(async (req: Request, res: Response) => {

    const { projectNumber, commonKey, projectThumbnail, ...rest } = (req.body);
    const { projectThumbnail: Thumbnail, id, ...updateMessageData } = req.body

    const findMessagee = await prisma.orderMessage.findMany({
        where: {
            commonKey: commonKey,
            projectNumber: projectNumber
        }
    })

    if (findMessagee.length === 0) {
        return sendResponse(res, {
            statusCode: httpStatus.NOT_FOUND,
            success: false,
            message: 'Order message not found'
        });
    }

    const updateMessage = await prisma.orderMessage.updateMany({
        where: {
            commonKey: commonKey,
            projectNumber: projectNumber
        }, data: {
            ...updateMessageData
        }
    });
    if (!updateMessage) {
        return sendResponse(res, {
            statusCode: httpStatus.NOT_FOUND,
            success: false,
            message: 'Message not update'
        });
    }

    await prisma.order.update({
        where: {
            projectNumber: projectNumber
        }, data: {
            projectStatus: 'Completed',
            projectThumbnail,
            trackProjectStatus: 'COMPLETE_PROJECT'
        }
    })

    return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Order Completed successfully'
    });
})
