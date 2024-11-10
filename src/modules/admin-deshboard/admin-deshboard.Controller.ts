import type { Request, Response } from "express";
import httpStatus from "http-status";
import { prisma } from "../../libs/prismaHelper";
import sendResponse from "../../libs/sendResponse";
import catchAsync from "../../libs/utlitys/catchSynch";
import AppError from "../../errors/AppError";
import { ProjectStatus } from "../Order_page/Order_page.constant";
import { calculateDateRange, timeFilterSchema } from "../../utils/calculateDateRange";
import { Prisma } from "@prisma/client";
import { PaymentStatus } from "../payment/payment.constant";

const findOrder = catchAsync(async (req: Request, res: Response) => {
    const { projectNumber, userName } = req.query;


    // Check if order exists
    const order = await prisma.order.findMany({
        where: {
            ...(projectNumber && { projectNumber: projectNumber as string }),
            ...(userName && {
                user: {
                    userName: userName as string
                }
            })
        },
        include: {
            OrderExtensionRequest: true,
            OrderMessage: true,
            Payment: true,
        }
    });

    console.log(order);

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

export const getOrderCount = catchAsync(async (req: Request, res: Response): Promise<void> => {
    const parseResult = timeFilterSchema.safeParse(req.query.timeFilter);
    if (!parseResult.success) {
        sendResponse(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: 'Invalid time filter',
            data: null
        });
        return;
    }

    const timeFilter = parseResult.data;
    const { startDate, endDate } = calculateDateRange(timeFilter);

    const whereClause: Prisma.OrderWhereInput = startDate ? {
        createdAt: {
            gte: startDate,
            lte: endDate
        },
    } : {};

    const [completedOrders, canceledOrders, cancelledAmount, payments] = await Promise.all([
        // Get completed orders count
        prisma.order.count({
            where: {
                ...whereClause,
                projectStatus: ProjectStatus.COMPLETED,
                paymentStatus: PaymentStatus.PAID
            }
        }),
        // Get canceled orders count
        prisma.order.count({
            where: {
                ...whereClause,
                projectStatus: ProjectStatus.CANCELED
            }
        }),

        // Get cancelled amount
        prisma.payment.findMany({
            where: {
                status: PaymentStatus.FAILED,
                Order: {
                    ...whereClause,
                    // projectStatus: ProjectStatus.CANCELED
                }
            },
            select: {
                amount: true
            }
        }),
        // Get total earnings from payments
        prisma.payment.findMany({
            where: {
                Order: {
                    ...whereClause,
                    paymentStatus: PaymentStatus.PAID,
                    projectStatus: ProjectStatus.COMPLETED
                },
                status: PaymentStatus.PAID
            },
            select: {
                amount: true
            }
        })
    ]);


    const totalCancelledAmount = cancelledAmount.reduce((acc, payment) => acc + parseFloat(payment.amount), 0);
    const totalEarnings = payments.reduce((acc, payment) => acc + parseFloat(payment.amount), 0);
    const averageOrderValue = payments.length ? totalEarnings / payments.length : 0;

    const totalOrder = {
        completedOrders,
        canceledOrders,
        totalEarnings,
        averageOrderValue,
        totalCancelledAmount
    };

    // Add date range information to response for clarity
    const responseData = {
        ...totalOrder,
        periodInfo: startDate ? {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            filterUsed: timeFilter
        } : {
            filterUsed: 'All Times'
        }
    };

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Order statistics fetched successfully",
        data: responseData
    });
});




export const OrderController = {
    findOrder,
    updateDesignerName,
    getOrderCount
}
