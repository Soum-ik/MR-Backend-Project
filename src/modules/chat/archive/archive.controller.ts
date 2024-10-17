import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import sendResponse from "../../../libs/sendResponse";
import { prisma } from "../../../libs/prismaHelper";
import { z } from "zod";


const archiveUserList = async (req: Request, res: Response, next: NextFunction) => {
    try {

        const archiveUser = await prisma.user.findMany({
            where: {
                archive: true
            }
        })

        if (archiveUser.length === 0) {
            return sendResponse(res, {
                statusCode: httpStatus.OK,
                success: true,
                data: "No user are archive"
            })
        }

        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            data: archiveUser
        })
    } catch (error) {
        console.error("Error retrieving available users for chat: ", error);

        if (error instanceof z.ZodError) {
            return sendResponse(res, {
                statusCode: httpStatus.BAD_REQUEST,
                success: false,
                message: "Validation failed",
                data: null,
            });
        }

        return sendResponse(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: "Internal server error",
            data: error,
        });
    }
}

const archiverUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params;

        const user = await prisma.user.findUnique({
            where: {
                id: userId
            },
            select: {
                archive: true,
                userName: true
            }
        })

        if (user) {
            await prisma.user.update({
                where: {
                    id: userId
                },
                data: {
                    archive: !user.archive
                }
            });

            return sendResponse(res, {
                statusCode: httpStatus.OK,
                success: true,
                message: `${user.userName} ${user.archive ? "unarchived" : "archived"} successfully at ${new Date().toISOString()}`,
                data: null
            });
        } else {
            return sendResponse(res, {
                statusCode: httpStatus.NOT_FOUND,
                success: false,
                message: "User not found",
                data: null
            });
        }

    } catch (error) {
        console.error("Error archiving/unarchiving user: ", error);
        return sendResponse(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: "Internal server error",
            data: error
        });
    }
}

const archiveUser = {
    archiveUserList
}

export default archiveUser;
