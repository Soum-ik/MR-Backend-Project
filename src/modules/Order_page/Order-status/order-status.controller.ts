import httpStatus from "http-status";
import { prisma } from "../../../libs/prismaHelper";
import sendResponse from "../../../libs/sendResponse";
import { z } from "zod";
import { type Request, type Response } from "express";
import AppError from "../../../errors/AppError";
import { TokenCredential } from "../../../libs/authHelper";
import { OrderStatus, PaymentStatus } from "@prisma/client";


const getOrderStatus = async (req: Request, res: Response) => {
    try {
        const user = req.user as TokenCredential;
        const { status } = req.query;



        const order = await prisma.order.findMany({
            where: {
                currentStatus: status as OrderStatus
            }
        });

        if (!order) {
            throw new AppError(httpStatus.NOT_FOUND, 'Order not found');
        }

        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: 'Order fetched successfully',
            data: order
        });
    } catch (error) {
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
}

export default getOrderStatus;

