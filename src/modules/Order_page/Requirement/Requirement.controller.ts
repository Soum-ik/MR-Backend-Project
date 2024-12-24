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

            const payload = {
                avatar: userData?.image,
                userId: userData?.id,
                userName: userData?.userName,
                thumbnailUrl: order?.projectImage,
            }

            await prisma.notification.create({
                data: {
                    recipient: "ADMIN",
                    message: `<div className = "flex-1" >
        <p className="text-sm font-medium sm:text-base text-gray-900 line-clamp-3" >
            { 'You have a new'}
            < span className = "font-bold" > order </>
{ ' and instructions from' }
<span className="font-bold" > ${userData.userName} </span>
{ ". Get Started." }
</p>
    </div>`,
                    senderId: userData?.id as string,
                    payload: payload
                }
            })
            PublicMessageHandler({
                msg: `<div className = "flex-1" >
        <p className="text-sm font-medium sm:text-base text-gray-900 line-clamp-3" >
            { 'You have a new '}
            < span className = "font-bold" > order </>
{ ' and instructions from' }
<span className="font-bold" > ${userData.userName} </span>
{ ". Get Started." }
</p>
    </div>`,
                avatar: userData.image,
                userId: userData.id,
                userName: userData.userName,
                thumbnailUrl: order.projectImage,
            }, 'USER');


            await prisma.notification.create({
                data: {
                    recipient: "USER",
                    message: `<div className="flex-1">
        <p className="text-sm font-medium sm:text-base text-gray-900 line-clamp-3">
          {'Your order has started! The designer is now working on your order.'}
        </p>
      </div>`,
                    senderId: userData?.id as string,
                    recipientId: order.userId,

                }
            })
            PublicMessageHandler({
                msg: `<div className="flex-1">
        <p className="text-sm font-medium sm:text-base text-gray-900 line-clamp-3">
          {'Your order has started! The designer is now working on your order.'}
        </p>
      </div>`,
                avatar: userData.image,
                userId: order.userId,
                userName: userData.userName,
                thumbnailUrl: order.projectImage,
            }, "ADMIN");
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