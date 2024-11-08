import type { Request, Response } from "express";
import httpStatus from "http-status";
import { prisma } from "../../libs/prismaHelper";
import sendResponse from "../../libs/sendResponse";
import catchAsync from "../../libs/utlitys/catchSynch";
import AppError from "../../errors/AppError";

const findOrder = catchAsync(async (req: Request, res: Response) => {
    const { projectNumber, userName } = req.query;

    if (!projectNumber && !userName) {
        throw new AppError(httpStatus.BAD_REQUEST, "At least one of project number or user name is required");
    }

    // Check if order exists
    const order = await prisma.order.findFirst({
        where: {
            ...(projectNumber ? { projectNumber: projectNumber as string } : {}),
            ...(userName ? {
                user: {
                    userName: userName as string
                }
            } : {})
        },
        ...(projectNumber ? {
            include: {
                OrderExtensionRequest: true,
                OrderMessage: true,
                Payment: true,
            }
        } : {})
    });
    if (!order) {
        throw new AppError(httpStatus.NOT_FOUND, "Order not found");
    }

    return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Order fetched successfully',
        data: order
    });

})

const updateDesignerName = catchAsync(async (req: Request, res: Response) => {

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

    if (!updateDesignerName) {
        throw new AppError(httpStatus.BAD_REQUEST, "Failed to update designer name");
    }

    return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Designer name updated successfully',
        data: updateDesignerName
    })

})

export const OrderController = {
    findOrder,
    updateDesignerName
}
