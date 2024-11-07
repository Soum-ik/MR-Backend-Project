import type { Request, Response } from "express";
import httpStatus from "http-status";
import { z } from "zod";
import { prisma } from "../../libs/prismaHelper";
import sendResponse from "../../libs/sendResponse";

const findOrder = async (req: Request, res: Response) => {
    try {
        const { projectNumber } = req.params;

        // Check if order exists
        const order = await prisma.order.findUnique({
            where: {
                projectNumber: projectNumber as string
            },
            include: {
                OrderExtensionRequest: true,
                OrderMessage: true,
                RequirementAnswer: true,
                Payment: true,

            }
        });
        if (!order) {
            return sendResponse
        }

        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: 'Order fetched successfully',
            data: order
        });
    } catch (error) {
        console.error(error);
        return sendResponse(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Failed to fetch order',
        });
    }
};

const updateDesignerName = async (req: Request, res: Response) => {
    try {
        const { designerName } = req.body;
        const { orderId } = req.params;

        if (!orderId) {
            return sendResponse(res, {
                statusCode: httpStatus.BAD_REQUEST,
                success: false,
                message: 'Order ID is required',
            });
        }

        const updateDesignerName = await prisma.order.update({
            where: { id: orderId },
            data: { designerName: designerName }
        })

        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: 'Designer name updated successfully',
            data: updateDesignerName
        })
    } catch (error) {
        console.error(error);
        return sendResponse(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Failed to update designer name',
        });
    }
}

export const OrderController = {
    findOrder,
    updateDesignerName
}
