import httpStatus from "http-status";
import { prisma } from "../../../libs/prismaHelper";
import sendResponse from "../../../libs/sendResponse";
import { z } from "zod";
import { type Request, type Response } from "express";
import AppError from "../../../errors/AppError";
import { TokenCredential } from "../../../libs/authHelper";
import { PaymentStatus } from "@prisma/client";
import { OrderStatus } from "../Order_page.constant";


const getOrderStatus = async (req: Request, res: Response) => {
    try {
        const { status, user_id } = req.query;
        const order = await prisma.order.findMany({
            where: {
                trackProjectStatus: status as OrderStatus,
                OR: [
                    {
                        userId: user_id as string
                    },
                ]
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

