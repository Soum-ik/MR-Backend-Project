import type { Request, Response } from 'express';
import { getPrismaFilter } from '../../../middleware/filterData';
import { prisma } from '../../../libs/prismaHelper';
import { z } from 'zod';
import httpStatus from 'http-status';
import sendResponse from '../../../libs/sendResponse';

const DeliveredOrders = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        const requestBody = req.body;

        // Find the order
        const order = await prisma.order.findUnique({
            where: {
                id: orderId
            }
        });

        if (!order) {
            return sendResponse(res, {
                statusCode: httpStatus.NOT_FOUND,
                success: false,
                data: null,
                message: "Order not found"
            });
        }

        // Update order with delivery request
        const updatedOrder = await prisma.order.update({
            where: {
                id: orderId
            },
            data: {
                adminDeliveryRequest: true,
                projectStatus: "Delivered",
                trackProjectStatus: "REVIEW_DELIVERY",
                submittedData: requestBody
            }
        });

        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            data: updatedOrder,
            message: "Delivery request sent successfully"
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return sendResponse<any>(res, {
                statusCode: httpStatus.BAD_REQUEST,
                success: false,
                data: null,
                message: `${error.message}`,
            });
        }

        return sendResponse<any>(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            data: null,
            message: `Internal server error`,
        });
    }
};

const handleDeliveryResponse = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body; // status should be 'accept' or 'reject'

        // Find the order
        const order = await prisma.order.findUnique({
            where: {
                id: orderId
            }
        });

        if (!order) {
            return sendResponse(res, {
                statusCode: httpStatus.NOT_FOUND,
                success: false,
                data: null,
                message: "Order not found"
            });
        }

        let updateData;
        if (status === 'accept') {
            updateData = {
                projectStatus: "Completed",
                trackProjectStatus: "COMPLETE_PROJECT",
                clientApproval: true
            };
        } else if (status === 'reject') {
            updateData = {
                projectStatus: "Revision",
                trackProjectStatus: "PROJECT_RUNNING",
                adminDeliveryRequest: false
            };
        } else {
            return sendResponse(res, {
                statusCode: httpStatus.BAD_REQUEST,
                success: false,
                data: null,
                message: "Invalid status. Must be 'accept' or 'reject'"
            });
        }

        // Update order based on response
        const updatedOrder = await prisma.order.update({
            where: {
                id: orderId
            },
            data: {
                projectStatus: status === 'accept' ? 'Completed' : 'Revision',
                trackProjectStatus: status === 'accept' ? 'COMPLETE_PROJECT' : 'PROJECT_RUNNING',
                clientApproval: status === 'accept' ? true : undefined,
                adminDeliveryRequest: status === 'reject' ? false : undefined
            }
        });

        const message = status === 'accept' ? 
            "Delivery accepted successfully" : 
            "Delivery rejected and sent for revision";

        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            data: updatedOrder,
            message
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return sendResponse<any>(res, {
                statusCode: httpStatus.BAD_REQUEST,
                success: false,
                data: null,
                message: `${error.message}`,
            });
        }

        return sendResponse<any>(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            data: null,
            message: `Internal server error`,
        });
    }
};

export const OrderDelivarController = {
    DeliveredOrders,
    handleDeliveryResponse
};
