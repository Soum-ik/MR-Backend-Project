import type { Request, Response } from "express";
import httpStatus from "http-status";
import { prisma } from "../../libs/prismaHelper";
import sendResponse from "../../libs/sendResponse";
import catchAsync from "../../libs/utlitys/catchSynch";
import AppError from "../../errors/AppError";
import { ProjectStatus } from "../Order_page/Order_page.constant";
import { calculateDateRange, timeFilterSchema } from "../../utils/calculateDateRange";
import { Prisma, Role } from "@prisma/client";
import { PaymentStatus } from "../payment/payment.constant";

const findOrder = catchAsync(async (req: Request, res: Response) => {
    const { projectNumber, userName, projectStatus, search } = req.query;

    // Check if order exists
    const order = await prisma.order.findMany({
        where: {
            ...(search && {
                OR: [
                    { projectNumber: { contains: search as string, mode: 'insensitive' } },
                    { user: { userName: { contains: search as string, mode: 'insensitive' } } }
                ]
            }),
            ...(projectNumber && { projectNumber: projectNumber as string }),
            ...(userName && {
                user: {
                    userName: userName as string
                }
            }),
            ...(projectStatus && { projectStatus: projectStatus as ProjectStatus }),
            ...(projectStatus === 'Active' && {
                projectStatus: {
                    notIn: [ProjectStatus.CANCELED, ProjectStatus.COMPLETED]
                }
            })
        },
        include: {
            OrderExtensionRequest: true,
            OrderMessage: true,
            Payment: true,
            user: {
                select: {
                    id: true,
                    userName: true,
                    image: true
                }
            },
            review: {
                include: {
                    sender: {
                        select: {
                            userName: true,
                            image: true,
                            fullName: true,
                            role: true,
                            email: true,
                            country: true,
                        }
                    }
                }
            }
        }
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
        data: ''
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

const projectStatus = catchAsync(async (req: Request, res: Response) => {
    const order = await prisma.order.findMany();
    // Initialize with all possible project statuses
    const initialStatusCounts = {
        Waiting: { count: 0, totalPrice: 0 },
        Ongoing: { count: 0, totalPrice: 0 },
        Revision: { count: 0, totalPrice: 0 },
        Dispute: { count: 0, totalPrice: 0 },
        Delivered: { count: 0, totalPrice: 0 },
        Canceled: { count: 0, totalPrice: 0 },
        Completed: { count: 0, totalPrice: 0 }
    };

    const orderStatusCounts = order.reduce((acc, order) => {
        const status = order.projectStatus;
        acc[status].count++;
        acc[status].totalPrice += Number(order.totalPrice || 0);
        return acc;
    }, initialStatusCounts);

    // Calculate active projects (excluding Canceled and Completed)
    const activeProjectsCount = order.reduce((count, order) => {
        if (order.projectStatus !== 'Canceled' && order.projectStatus !== 'Completed') {
            return count + 1;
        }
        return count;
    }, 0);

    const activeProjectsTotalPrice = order.reduce((total, order) => {
        if (order.projectStatus !== 'Canceled' && order.projectStatus !== 'Completed') {
            return total + Number(order.totalPrice || 0);
        }
        return total;
    }, 0);

    const formattedOrders = [
        {
            id: 0,
            name: 'Active Projects',
            quantity: activeProjectsCount,
            totalPrice: activeProjectsTotalPrice
        },
        ...Object.entries(orderStatusCounts).map(([status, data], index) => ({
            id: index + 1,
            name: `${status}`,
            quantity: data.count,
            totalPrice: data.totalPrice
        }))
    ];

    if (order.length === 0) {
        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: 'No order found',
            data: null
        });
    }

    return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Order fetched successfully',
        data: formattedOrders
    });
})

const UsersStatus = catchAsync(async (req: Request, res: Response) => {
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

    const whereClause: Prisma.UserWhereInput = startDate ? {
        createdAt: {
            gte: startDate,
            lte: endDate
        },
    } : {};
    const [returning, newUser, affiliate] = await Promise.all([
        prisma.user.findMany({
            where: {
                ...whereClause,
                totalOrder: {
                    gt: 0
                },
                role: {
                    notIn: [Role.ADMIN, Role.SUB_ADMIN, Role.SUPER_ADMIN]
                },
            },
            select: {
                id: true,
                userName: true,
                fullName: true,
                image: true,
                role: true,
                createdAt: true,
                affiliateId: true,
                AffiliateJoin: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                userName: true,
                                image: true
                            }
                        }
                    }
                },
            },
        }),
        prisma.user.findMany({
            where: {
                ...whereClause,
                totalOrder: 0,
                role: {
                    not: {
                        in: [Role.ADMIN, Role.SUB_ADMIN, Role.SUPER_ADMIN]
                    }
                }
            },
            select: {
                id: true,
                userName: true,
                image: true,
                createdAt: true
            },

        }),
        prisma.affiliate.findMany({
            where: {
                user: {
                    role: {
                        notIn: [Role.ADMIN, Role.SUB_ADMIN, Role.SUPER_ADMIN]
                    },
                },
            },
            select: {
                user: {
                    select: {
                        id: true,
                        userName: true,
                        fullName: true
                    }
                },
                AffiliateJoin: {
                    select: {
                        user: {
                            select: {
                                id: true,
                                userName: true,
                                image: true,
                                fullName: true
                            }
                        }
                    }
                }
            }
        })
    ])

    return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Users fetched successfully',
        data: { returning, newUser, affiliate }
    });
})

export const OrderController = {
    findOrder,
    updateDesignerName,
    getOrderCount,
    projectStatus,
    UsersStatus
}
