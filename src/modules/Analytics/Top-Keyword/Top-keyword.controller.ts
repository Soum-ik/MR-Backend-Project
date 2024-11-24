import { Request, Response } from "express";
import catchAsync from "../../../libs/utlitys/catchSynch";
import { prisma } from "../../../libs/prismaHelper";
import AppError from "../../../errors/AppError";
import sendResponse from "../../../libs/sendResponse";
import httpStatus from "http-status";


const udpateImpressionRate = catchAsync(async (req: Request, res: Response) => {
    const { keywords } = req.query;

    if (!keywords) {
        throw new AppError(400, "Keyword is required");
    }

    // Split the keyword string into an array
    const keywordList = (keywords as string).split(',').map(k => k.trim());

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

const getOrderByKey = catchAsync(async (req: Request, res: Response) => {
    // Get all tags with their order details
    const tags = await prisma.tags.findMany({
        include: {
            order: {

            }
        }
    });

    // Calculate statistics for each tag
    const tagStats = tags.reduce((acc, tag) => {
        if (!acc[tag.name]) {
            acc[tag.name] = {
                name: tag.name,
                totalOrders: 0,
                totalIncome: 0,
                impressions: tag.impressions,
                clicks: tag.clicks
            };
        }

        // Since order is an array, we need to iterate through each order
        tag.order.forEach(order => {
            acc[tag.name].totalOrders++;
            const price = parseFloat(order.totalPrice);
            if (!isNaN(price)) {
                acc[tag.name].totalIncome += price;
            }
        });

        return acc;
    }, {} as Record<string, {
        name: string;
        totalOrders: number;
        totalIncome: number;
        impressions: number;
        clicks: number;
    }>);

    const results = Object.values(tagStats).map(stat => ({
        ...stat,
        totalIncome: stat.totalIncome.toFixed(2) // Format to 2 decimal places
    }));

    return sendResponse(res, ({
        statusCode: httpStatus.OK,
        success: true,
        message: "Tag statistics retrieved successfully",
        data: results
    }));
});


export const TopKeywordController = {
    getOrderByKey,
    updateClickRate,
    udpateImpressionRate
}


