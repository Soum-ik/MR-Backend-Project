import catchAsync from "../../../libs/utlitys/catchSynch";
import { Request, Response } from "express";
import sendResponse from "../../../libs/sendResponse";
import httpStatus from "http-status";
import { prisma } from "../../../libs/prismaHelper";
import { Prisma, VisitorStatus } from "@prisma/client";
import { timeFilterSchema } from "../../../utils/calculateDateRange";
import { calculateDateRange } from "../../../utils/calculateDateRange";

const increaseVisitors = catchAsync(async (req: Request, res: Response) => {
    const { status } = req.user as { status: VisitorStatus };
    const visitor = await prisma.visitors.create({
        data: {
            status: status as VisitorStatus
        }
    })

    const totalVisitors = await prisma.visitors.count();

    return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Visitors increased successfully",
        data: {
            visitor,
            totalVisitors
        }
    })
})

const getVisitors = catchAsync(async (req: Request, res: Response) => {

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

    const whereClause: Prisma.VisitorsWhereInput = startDate ? {
        createdAt: {
            gte: startDate,
            lte: endDate
        },
    } : {};

    const newVisitors = await prisma.visitors.findMany({ where: { ...whereClause, status: VisitorStatus.NEW_CLIENT } });
    const ReturningVisitors = await prisma.visitors.findMany({ where: { ...whereClause, status: VisitorStatus.REPEATED_CLIENT } });

    const totalVisitors = newVisitors.length + ReturningVisitors.length;

    return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Visitors fetched successfully",
        data: {
            newVisitors: newVisitors.length,
            ReturningVisitors: ReturningVisitors.length,
            totalVisitors
        },
    })
})

export const visitros = {
    increaseVisitors,
    getVisitors
}
