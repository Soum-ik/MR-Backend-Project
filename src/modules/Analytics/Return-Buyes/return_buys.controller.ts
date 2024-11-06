import type { Request, Response } from "express";
import sendResponse from "../../../libs/sendResponse";
import httpStatus from "http-status";
import { z } from "zod";
import { prisma } from "../../../libs/prismaHelper";
import { USER_ROLE } from "../../user/user.constant";
import { getPrismaFilter } from "../../../middleware/filterData";

const ReturnBuyesController = async (req: Request, res: Response) => {
    try {
        const filter = getPrismaFilter(req);

        const users = await prisma.user.findMany({
            where: {
                role: USER_ROLE.USER,
                Payment: {
                    some: {
                        createdAt: filter.where.createdAt
                    }
                }
            },
            select: {
                userName: true,
                totalOrder: true,
                Payment: {
                    select: {
                        amount: true,
                        createdAt: true
                    },
                    where: {
                        createdAt: filter.where.createdAt
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
                _count: {
                    select: {
                        Payment: true
                    }
                }
            }
        });

        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            data: {
                users,
                filterType: req.query.filterType || 'All Times'
            },
            message: "Return buyers retrieved successfully"
        });
        
    } catch (error) {
        console.error(error);

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
}
    
export default ReturnBuyesController;
