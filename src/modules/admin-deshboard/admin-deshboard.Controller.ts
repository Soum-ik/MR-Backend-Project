import type { Request, Response } from "express";
import httpStatus from "http-status";
import { prisma } from "../../libs/prismaHelper";
import sendResponse from "../../libs/sendResponse";
import catchAsync from "../../libs/utlitys/catchSynch";
import AppError from "../../errors/AppError";
import { ProjectStatus } from "../Order_page/Order_page.constant";

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

// const getOrderCount = catchAsync(async (req: Request, res: Response) => {
//     const { timeFilter } = req.query;
//     const [completedOrders, canceledOrders, totalEarnings] = await Promise.all([
//         // Get completed orders count
//         prisma.order.count({
//             where: {
//                 projectStatus: ProjectStatus.COMPLETED
//             }
//         }),
//         // Get canceled orders count 
//         prisma.order.count({
//             where: {
//                 projectStatus: ProjectStatus.CANCELED
//             }
//         }),
//         // Get total earnings and calculate average
//         prisma.order.aggregate({
//             where: {
//                 projectStatus: ProjectStatus.COMPLETED
//             },
//             _sum: {
//                 totalAmount: true
//             },
//             _avg: {
//                 totalAmount: true
//             }
//         })
//     ]);

//     const totalOrder = {
//         completedOrders,
//         canceledOrders,
//         totalEarnings: totalEarnings._sum.totalAmount || 0,
//         averageOrderValue: totalEarnings._avg.totalAmount || 0
//     };
//     return sendResponse(res, {
//         statusCode: httpStatus.OK,
//         success: true,
//         message: "Total order count fetched successfully",
//         data: totalOrder
//     })
// })

export const OrderController = {
    findOrder,
    updateDesignerName,
    // getOrderCount
}
