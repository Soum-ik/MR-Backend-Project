import type { Request, Response } from 'express'; 
import { prisma } from '../../../libs/prismaHelper'; 
import httpStatus from 'http-status';
import sendResponse from '../../../libs/sendResponse';
import { ProjectStatus } from '../Order_page.constant'; 
import catchAsync from '../../../libs/utlitys/catchSynch';
import { trackProjectStatus } from '@prisma/client';


export const CancelProject = catchAsync(async (req: Request, res: Response) => {

    const { orderId, orderMessageId } = (req.body);

    const findMessagee = await prisma.orderMessage.findUnique({
        where: {
            id: orderMessageId
        }
    })

    if (!findMessagee) {
        return sendResponse(res, {
            statusCode: httpStatus.NOT_FOUND,
            success: false,
            message: 'Order message not found'
        });
    }

    const cancelMessage = await prisma.orderMessage.update({
        where: {
            id: orderMessageId
        }, data: {
            isCancelled: true
        }
    });

    if (!cancelMessage) {
        return sendResponse(res, {
            statusCode: httpStatus.NOT_FOUND,
            success: false,
            message: 'Order not cancelled'
        });
    }

    await prisma.order.update({
        where: {
            id: orderId
        }, data: {
            projectStatus: ProjectStatus.CANCELED,
            trackProjectStatus: trackProjectStatus.CANCELLED
        }
    });

    return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Order cancelled successfully'
    });
})
