import httpStatus from "http-status"
import type { Request, Response, NextFunction } from "express"
import type { JwtPayload } from "jsonwebtoken"
import sendResponse from "../../../libs/sendResponse";
import { verifyToken } from "../../../libs/authHelper";
import { prisma } from "../../../libs/prismaHelper";

const authenticate_for_startProject = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return sendResponse(res, {
            statusCode: httpStatus.FORBIDDEN,
            success: false,
            message: 'Authorization header is missing',
        });
    }

    const token = authHeader.split(' ')[1] || authHeader;
    if (!token) {
        return sendResponse(res, {
            statusCode: httpStatus.NOT_FOUND,
            success: false,
            message: 'Token not found'
        });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return sendResponse(res, {
            statusCode: httpStatus.FORBIDDEN,
            success: false,
            message: 'Token is invalid',
        });
    }
    const user = decoded as JwtPayload;

    const order_status = await prisma.order.findUnique({
        where: {
            id: user?.user_id
        }
    });

    if (!order_status) {
        return sendResponse(res, {
            statusCode: httpStatus.NOT_FOUND,
            success: false,
            message: "Order not found",
        });
    }


    if (user?.role === "USER") {
        if (order_status?.paymentStatus === "COMPLETED") {
            next();
        } else {
            return sendResponse(res, {
                statusCode: httpStatus.FORBIDDEN,
                success: false,
                message: "Payment not completed. You're not able to start the project",
            });
        }
    } else {
        next();
    }
}

export default authenticate_for_startProject
