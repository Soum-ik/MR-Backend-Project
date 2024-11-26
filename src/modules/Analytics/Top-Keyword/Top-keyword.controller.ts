import { Request, Response } from "express";
import catchAsync from "../../../libs/utlitys/catchSynch";
import { prisma } from "../../../libs/prismaHelper";
import AppError from "../../../errors/AppError";
import sendResponse from "../../../libs/sendResponse";
import httpStatus from "http-status";
import { ProjectStatus } from "@prisma/client";


const udpateImpressionRate = catchAsync(async (req: Request, res: Response) => {
    const { keywords } = req.query;

    // Ensure `keywords` is an array. If it's a string, split it into an array.
    if (!keywords) {
        throw new AppError(400, "Keywords are required");
    }

    let keywordList: string[];

    // If `keywords` is a string, split by commas into an array.
    if (typeof keywords === 'string') {
        keywordList = keywords.split(',').map(i => i.trim()); // `trim` to remove any surrounding whitespace
    } else {
        throw new AppError(400, "Invalid format for keywords");
    }
    const keywordData = await prisma.tags.findMany({
        where: {
            name: {
                in: keywordList
            }
        }
    });

    if (keywordData.length > 0) {
        await prisma.tags.updateMany({
            where: {
                name: {
                    in: keywordList
                }
            },
            data: {
                impressions: { increment: 1 },
            }
        });
    }

    return sendResponse(res, ({
        statusCode: httpStatus.OK,
        success: true,
        message: "Keywords updated successfully",
        data: keywordData
    }))

});


const updateClickRate = catchAsync(async (req: Request, res: Response) => {
    const { keyword } = req.params;

    const updateKeyword = await prisma.tags.update({
        where: {
            name: keyword
        },
        data: {
            clicks: { increment: 1 }
        }
    })

    if (updateKeyword) {
        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: `${keyword} update the click rate`

        })
    } else {
        return sendResponse(res, {
            statusCode: httpStatus.NOT_FOUND,
            success: false,
            message: `${keyword} not found`
        });
    }
})
const getTagStatistics = catchAsync(async (req: Request, res: Response) => {
    // Fetch all tags with their related orders
    const tags = await prisma.tags.findMany({
        include: {
            order: {
                select: {
                    projectStatus: true, // To determine completed orders
                    totalPrice: true,    // To calculate total sales
                },
            },
        },
    });

    // Calculate statistics for each tag
    const tagStats = tags.map((tag) => {
        // Check if the order is completed
        const isCompletedOrder = tag.order?.projectStatus === "COMPLETED" as ProjectStatus;

        // Calculate total sales from the completed order
        const totalSales = isCompletedOrder
            ? parseFloat(tag.order?.totalPrice) || 0
            : 0;


        return {
            name: tag.name,
            // totalOrders: tag.order ? 1 : 0, // Total number of orders for the tag
            totalOrders: isCompletedOrder ? 1 : 0, // Count completed orders
            totalSales: totalSales, // Format sales to 2 decimal places
            impressions: tag.impressions,
            clicks: tag.clicks,

        };
    });

    // Send response
    return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Tag statistics retrieved successfully",
        data: tagStats,
    });
});


export const TopKeywordController = {
    getTagStatistics,
    updateClickRate,
    udpateImpressionRate
}


