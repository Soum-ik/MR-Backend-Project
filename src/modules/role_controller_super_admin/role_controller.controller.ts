import { Request, Response } from "express";
import httpStatus from "http-status";
import { prisma } from "../../libs/prismaHelper";
import sendResponse from "../../libs/sendResponse";
import { TokenCredential } from "../../libs/authHelper";


const controle_role = async (req: Request, res: Response) => {

    try {
        const { user_id, role } = req.body;
        const findUser = await prisma.user.findUnique({
            where: {
                id: user_id,
            },
        });
        if (!findUser) {
            return sendResponse(res, {
                statusCode: httpStatus.NOT_FOUND,
                success: false,
                message: "User not found",
            });
        }
        const updateUser = await prisma.user.update({
            where: {
                id: user_id,
            },
            data: {
                role: role,
            },
        });
        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: `User role updated successfully. User details: Name: ${updateUser.fullName}, Email: ${updateUser.email}, ID: ${updateUser.id}, Role: ${updateUser.role}`,
            data: null,
        });
    } catch (error) {
        return sendResponse(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: "Error updating user role",
        });
    }
}

export const controle_role_controller = {
    controle_role
}


