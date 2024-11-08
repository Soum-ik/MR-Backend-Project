import type { Request, Response } from "express";
import httpStatus from "http-status";
import { z } from "zod";
import { prisma } from "../../../libs/prismaHelper";
import sendResponse from "../../../libs/sendResponse";
import { ProjectStatus } from "../Order_page.constant";
import { OrderStatus } from "../Order_page.constant";


const calculateDeliveryDate = (duration: number): Date => {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + duration);
    return deliveryDate;
};

const answerRequirements = async (req: Request, res: Response) => {
    try {
        const { orderId, requirements, isRequirementsFullFilled } = req.body;
        // Check if order exists
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order) {
            return sendResponse<any>(res, {
                statusCode: httpStatus.INTERNAL_SERVER_ERROR,
                success: false,
                message: "Order id are not found",
            });
        }
        const updateRequirements = await prisma.order.update({
            where: {
                id: orderId
            },
            data: {
                requirements: requirements,
                isRequirementsFullFilled: isRequirementsFullFilled
            }
        })
        if (updateRequirements.isRequirementsFullFilled) {
            const { duration } = updateRequirements
            await prisma.order.update({
                where: {
                    id: orderId
                },
                data: {
                    trackProjectStatus: OrderStatus.REQUIREMENTS_SUBMITTED,
                    projectStatus: ProjectStatus.ONGOING,
                    startDate: new Date(),
                    deliveryDate: calculateDeliveryDate(parseInt(duration))
                }
            })

            return sendResponse<any>(res, {
                statusCode: httpStatus.CREATED,
                success: true,
                message: "Requirement placed successfully saved & project start",
            });
        }
        return sendResponse<any>(res, {
            statusCode: httpStatus.CREATED,
            success: true,
            message: "Requirement not placed successfully saved",
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return sendResponse<any>(res, {
                statusCode: httpStatus.BAD_GATEWAY,
                success: false,
                message: "Validation error",
                data: error,
            });
        }

        return sendResponse<any>(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: "An unexpected error occurred",
            data: error,
        });
    }
};



export const requirementAnswer = {
    answerRequirements
}