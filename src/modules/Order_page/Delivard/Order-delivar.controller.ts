import type { Request, Response } from 'express';
import { getPrismaFilter } from '../../../middleware/filterData';
import { prisma } from '../../../libs/prismaHelper';
import { z } from 'zod';
import httpStatus from 'http-status';
import sendResponse from '../../../libs/sendResponse';
import { ProjectStatus } from '../Order_page.constant';
import { OrderStatus } from '../Order_page.constant';
import catchAsync from '../../../libs/utlitys/catchSynch';
import { affiliateWithdrawType } from '@prisma/client';


interface deliverProjectT {
    isRevision: boolean;
    isAccepted: boolean;
    thumbnailImage: object;
    attachments: Array<object>;
}

const DeliveredOrders = catchAsync(async (req: Request, res: Response) => {
    const { projectNumber, uniqueId, ...rest } = req.body;

    const result = await prisma.$transaction(async (prisma) => {
        const order = await prisma.order.findUnique({
            where: {
                projectNumber
            }
        });

        if (!order) {
            throw new Error("Order not found");
        }

        // Update order with delivery request
        await prisma.order.update({
            where: {
                projectNumber
            },
            data: {
                adminDeliveryRequest: true,
                clientApproval: true,
                projectStatus: ProjectStatus.DELIVERED,
                trackProjectStatus: OrderStatus.COMPLETE_PROJECT,
                submittedData: rest,
                deliveryAttempt: 2
            }
        });

        const { isAccepted, ...other } = rest?.deliverProject as unknown as deliverProjectT;

        // Update order with delivered data
        const updateMessage = {
            isAccepted: true,
            other
        };

        // Update all messages with the same uniqueId
        await prisma.orderMessage.updateMany({
            where: {
                uniqueId: uniqueId
            },
            data: {
                deliverProject: updateMessage
            }
        });

        return order;
    });

    return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        data: result,
        message: "Delivery accepted successfully"
    });
});

const handleDeliveryResponse = catchAsync(async (req: Request, res: Response) => {
    const { projectNumber, uniqueId, ...rest } = req.body;

    const result = await prisma.$transaction(async (prisma) => {
        const order = await prisma.order.findUnique({
            where: {
                projectNumber
            }
        });

        if (!order) {
            throw new Error("Order not found");
        }

        // Update order with delivery request
        await prisma.order.update({
            where: {
                projectNumber
            },
            data: {
                adminDeliveryRequest: true,
                projectStatus: ProjectStatus.REVISION,
                trackProjectStatus: OrderStatus.REVIEW_DELIVERY,
                submittedData: rest,
                deliveryAttempt: 1
            }
        });

        const { isRevision, ...other } = rest?.deliverProject as unknown as deliverProjectT;

        // Update order with delivered data
        const updateMessage = {
            isRevision: true,
            other
        };

        // Update all messages with the same uniqueId
        await prisma.orderMessage.updateMany({
            where: {
                uniqueId: uniqueId
            },
            data: {
                deliverProject: updateMessage
            }
        });

        return order;
    });

    return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        data: result,
        message: "Delivery accepted successfully"
    });
});

export const OrderDelivarController = {
    DeliveredOrders,
    handleDeliveryResponse
};

