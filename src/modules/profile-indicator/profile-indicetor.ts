import { Request, Response } from "express";
import catchAsync from "../../libs/utlitys/catchSynch";
import sendResponse from "../../libs/sendResponse";
import httpStatus from "http-status";
import { prisma } from "../../libs/prismaHelper";
import { ProjectStatus } from "@prisma/client";
import { Avg_Response_Time } from "../../scheduler_task/Avg_Response_Time";
import { formatDistanceToNow } from 'date-fns';

const IndicatorController = catchAsync(async (req: Request, res: Response) => {

    const avgDeliveryTime = await prisma.order.findMany({
        where: {
            startDate: { not: null },
            deliveryDate: { not: null }
        },
        select: {
            startDate: true,
            deliveryDate: true
        }
    });

    const onTimeOrders = avgDeliveryTime.filter((order) => {

        if (!order.startDate || !order.deliveryDate) return false;

        const deliveryDate = new Date(order.deliveryDate);
        const projectStartDate = new Date(order.startDate);

        // Check if the order is delivered on or before the expected delivery date
        // Modify deadline logic if "duration" is used to calculate deadlines
        return deliveryDate <= projectStartDate;
    });

    // Calculate on-time delivery percentage
    const onTimePercentage = (onTimeOrders.length / avgDeliveryTime.length) * 100;

    // Format and return the result
    const averageDeliveryTime = `${onTimePercentage.toFixed(2)}%`;


    const [Active_Projects, LastProjectCompleted, Avg_Rating] = await Promise.all([
        await prisma.order.findMany({
            where: {
                projectStatus: {
                    notIn: [ProjectStatus.Completed, ProjectStatus.Canceled]
                }
            }
        }),
        await prisma.order.findFirst({
            orderBy: {
                createdAt: "desc"
            },
            where: {
                projectStatus: ProjectStatus.Completed
            },
            select: {
                updatedAt: true
            }
        }),

        await prisma.review.aggregate({
            _avg: {
                rating: true
            }
        })
    ])

    const Avg_Respons = Avg_Response_Time

    return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Profile indicator fetched successfully",
        data: {
            Active_Projects: Active_Projects?.length,
            LastProjectCompleted: {
                date: LastProjectCompleted?.updatedAt ? formatDistanceToNow(new Date(LastProjectCompleted?.updatedAt), { addSuffix: true }) : null
            },
            Avg_Rating: Avg_Rating?._avg.rating,
            Avg_Respons: averageDeliveryTime
        }
    })
})


export const Indicator = { IndicatorController }
