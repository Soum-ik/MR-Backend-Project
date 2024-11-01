import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status";
import { prisma } from "../../libs/prismaHelper";
import sendResponse from "../../libs/sendResponse";
import { v4 as uuidv4 } from 'uuid';
import AppError from "../../errors/AppError";
import { USER_ROLE } from "../user/user.constant";

const sendMessageForChat = async (req: Request, res: Response, next: NextFunction) => {

    try {
        const { user_id: senderId } = req.params;

        if (!req.user || !req.user.email || !req.user.user_id) {
            throw new AppError(httpStatus.BAD_REQUEST, 'User information is missing or userId is required');
        }


        const contactEntry = await prisma.contactForChat.create({
            data: {
                userId: senderId,
            },
        });

        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Contact created successfully",
            data: contactEntry,
        });
    } catch (error) {
        console.log(error);

        return sendResponse(res, {
            statusCode: 500,
            success: false,
            data: error,
            message: "Something went wrong!"
        })
    }

};

export { sendMessageForChat };
