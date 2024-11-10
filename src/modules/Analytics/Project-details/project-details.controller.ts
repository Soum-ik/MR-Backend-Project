import { Request, Response } from "express";
import catchAsync from "../../../libs/utlitys/catchSynch";
import sendResponse from "../../../libs/sendResponse";
import httpStatus from "http-status";
import { ProjectStatus } from "../../Order_page/Order_page.constant";
import { prisma } from "../../../libs/prismaHelper";
import { promise } from "zod";
import { timeFilterSchema } from "../../../utils/calculateDateRange";
import { calculateDateRange } from "../../../utils/calculateDateRange";
import { Prisma } from "@prisma/client";

const ActiveProject = catchAsync(async (req: Request, res: Response) => {
    const [Revision, Ongoing, Waiting, Delivered] = await Promise.all([
        prisma.order.count({
            where: {
                projectStatus: ProjectStatus.REVISION
            }
        }),
        prisma.order.count({
            where: {
                projectStatus: ProjectStatus.ONGOING
            }
        }),
        prisma.order.count({
            where: {
                projectStatus: ProjectStatus.WAITING
            }
        }),
        prisma.order.count({
            where: {
                projectStatus: ProjectStatus.DELIVERED
            }
        }),

    ])

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Active project fetched successfully",
        data: {
            Revision: Revision,
            Ongoing: Ongoing,
            Waiting: Waiting,
            Delivered: Delivered
        }
    })
})

const FinishedProjects = catchAsync(async (req: Request, res: Response) => {

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

    const [Completed, Cancelled] = await Promise.all([
        prisma.order.findMany({
            where: {
                ...whereClause,
                projectStatus: ProjectStatus.COMPLETED
            }
        }),
        prisma.order.findMany({
            where: {
                ...whereClause,
                projectStatus: ProjectStatus.CANCELED
            }
        })
    ])

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Finished projects fetched successfully",
        data: {
            Completed: Completed?.length,
            Cancelled: Cancelled?.length
        }
    })
})

const ProjectBuyers = catchAsync(async (req: Request, res: Response) => {
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

    const whereClause = startDate ? {
        Order: {
            some: {
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            }
        }
    } : {};
    
    const buyers = await prisma.user.findMany({
        where: {
            role: "USER",
            ...whereClause,
            Order: {
                some: {}
            }
        },
        include: {
            _count: {
                select: {
                    Order: true
                }
            }
        }
    });

    // Use _count.Order instead of totalOrder since that's what we're including
    const newBuys = buyers.filter(buyer => buyer._count.Order === 1);
    const oldBuys = buyers.filter(buyer => buyer._count.Order > 1);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Project buyers fetched successfully",
        data: {
            NewBuyers: newBuys.length,
            OldBuyers: oldBuys.length
        }
    });
})

export const ProjectDetailsController = {
    ActiveProject,
    FinishedProjects,
    ProjectBuyers
}