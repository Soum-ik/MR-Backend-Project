import { Request, Response } from "express";
import catchAsync from "../../libs/utlitys/catchSynch";
import sendResponse from "../../libs/sendResponse";
import httpStatus from "http-status";
import { prisma } from "../../libs/prismaHelper";
import { ProjectStatus } from "@prisma/client";
import { Avg_Response_Time } from "../../scheduler_task/Avg_Response_Time";


const IndicatorController = catchAsync(async (req: Request, res: Response) => {

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
        data: { Active_Projects, LastProjectCompleted, Avg_Rating, Avg_Respons }
    })
})


export const Indicator = { IndicatorController }
