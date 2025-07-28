import type { Request, Response } from "express";
import sendResponse from "../../../libs/sendResponse";
import httpStatus from "http-status";
import { print } from "../../../helper/colorConsolePrint.ts/colorizedConsole";
import { prisma } from "../../../libs/prismaHelper";
import { USER_ROLE } from "../../user/user.constant";
import { timeFilterSchema } from "../../../utils/calculateDateRange";
import { calculateDateRange } from "../../../utils/calculateDateRange";
import { PaymentStatus, Prisma } from "@prisma/client";

const ReturnBuyesController = async (req: Request, res: Response) => {
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

    const users = await prisma.user.findMany({
        where: {
            ...whereClause,
            role: USER_ROLE.USER,
            totalOrder: {
                gt: 0
            }
        },
        select: {
            Order: {
                where: {
                    projectStatus: 'Completed'
                }
            },
            userName: true,
            totalOrder: true,
            id: true,
        }
    });

    print.blue(users, 'total order completed from the user');


    const payments = await prisma.payment.findMany({
        where: {
            Order: {
                userId: {
                    in: users.map(user => user.id)
                },
                projectStatus : 'Completed'
            },
            status: PaymentStatus.PAID,

        },
        select: {
            userId: true,
            amount: true
        }
    });



    // Group and sum payments by userId
    const paymentsByUser = payments.reduce((acc, payment) => {
        if (!acc[payment.userId]) {
            acc[payment.userId] = 0;
        }
        acc[payment.userId] += Number(payment.amount);
        return acc;
    }, {} as Record<string, number>);



    const usersWithPayments = users.map(user => {
        return {
            userName: user.userName,
            totalOrders: user.Order.length,
            totalPayments: paymentsByUser[user.id] || 0
        };
    });

    return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        data: {
            users: usersWithPayments,
            filterType: timeFilter || 'All Times'
        },
        message: "Return buyers retrieved successfully"
    });
}

export default ReturnBuyesController;
