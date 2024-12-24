import type { Request, Response } from "express";
import httpStatus from "http-status";
import { prisma } from "../../../libs/prismaHelper";
import sendResponse from "../../../libs/sendResponse";
import { ProjectStatus } from "../Order_page.constant";
import { OrderStatus } from "../Order_page.constant";
import catchAsync from "../../../libs/utlitys/catchSynch";
import PublicMessageHandler from "../../../socket/handlers/PublicMessageHandler";
import { JwtPayload } from "jsonwebtoken";
import { userFinder } from "../../../utils/userFinder";
import { TokenCredential } from "../../../libs/authHelper";
import { User } from "@prisma/client";


const calculateDeliveryDate = (duration: string | null, durationHours: string | null): Date => {
    const deliveryDate = new Date();
    if (duration) {
        deliveryDate.setDate(deliveryDate.getDate() + parseInt(duration));
    }
    if (durationHours) {
        deliveryDate.setHours(deliveryDate.getHours() + parseInt(durationHours));
    }
    return deliveryDate;
};

const answerRequirements = catchAsync(async (req: Request, res: Response) => {
    const { user_id } = req.user as TokenCredential;
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
        const { duration, durationHours } = updateRequirements
        await prisma.order.update({
            where: {
                id: orderId
            },
            data: {
                trackProjectStatus: OrderStatus.REQUIREMENTS_SUBMITTED,
                projectStatus: ProjectStatus.ONGOING,
                startDate: new Date(),
                deliveryDate: duration || durationHours ? calculateDeliveryDate(duration, durationHours) : new Date()
            }
        })


        if (user_id) {
            const userData = await userFinder(user_id) as User;

            await prisma.notification.create({
                data: {
                    recipient: "ADMIN",
                    message: `You have a new <b>order</b> and instructions from  <b>${userData.userName} </b> . Get Started.`,
                    senderId: userData?.id as string,
                }
            })
            PublicMessageHandler({
                msg: `You have a new <b>order</b> and instructions from  <b>${userData.userName} </b> . Get Started.`,
                avatar: userData.image,
            }, userData.role);


            await prisma.notification.create({
                data: {
                    recipient: "ADMIN",
                    message: `Your order has started! The designer is now working on your order.`,
                    senderId: userData?.id as string,
                }
            })
            PublicMessageHandler({
                msg: `Your order has started! The designer is now working on your order.`,
                avatar: userData.image,
            }, userData.role);
        }

        return sendResponse<any>(res, {
            statusCode: httpStatus.CREATED,
            success: true,
            message: "Requirement placed successfully saved & project start",
        });
    };
    return sendResponse<any>(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Requirement not placed successfully saved",
    });

});



export const requirementAnswer = {
    answerRequirements
}