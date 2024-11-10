import catchAsync from "../../../libs/utlitys/catchSynch";
import { Request, Response } from "express";
import sendResponse from "../../../libs/sendResponse";
import httpStatus from "http-status";
import { prisma } from "../../../libs/prismaHelper";
import { VisitorStatus } from "@prisma/client";

const increaseVisitors = catchAsync(async (req: Request, res: Response) => {
    const { status } = req.user as { status: string };

    const visitor = await prisma.visitors.create({
        data: {
            status: status as VisitorStatus
        }
    })

    // sendResponse(res, httpStatus.OK, { visitor }, "Visitors increased successfully")
})

export const visitros = {
    increaseVisitors,
}
