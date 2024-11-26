import httpStatus from "http-status"
import type { Request, Response, NextFunction } from "express"
import type { JwtPayload } from "jsonwebtoken"
import sendResponse from "../../../libs/sendResponse";
import { verifyToken } from "../../../libs/authHelper";
import { prisma } from "../../../libs/prismaHelper";
import { IncomingHttpHeaders } from 'http'
import AppError from "../../../errors/AppError";
import { PaymentStatus } from "../../payment/payment.constant";

const authenticate_for_startProject = async (req: Request, res: Response, next: NextFunction) => {
    const { authorization: authHeader, ordertoken } = req.headers;

 


    if (!authHeader) {
        return new AppError(httpStatus.FORBIDDEN, 'authorization header is missing')
    }

    const token = authHeader.split(' ')[1] || authHeader;
    if (!token) {
        return new AppError(httpStatus.NOT_FOUND, 'Token not foumd',)
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return new AppError(httpStatus.FORBIDDEN, 'Token invalidate')
    }
    const user = decoded as JwtPayload;

    if (user?.role === "USER") {
        const order_status = await prisma.order.findUnique({
            where: {
                OrderToken: ordertoken as string,
                userId: user.user_id
            }
        });
        if (!order_status) {
 
            return sendResponse(res, {
                statusCode: httpStatus.NOT_FOUND,
                success: false,
                message: 'Order are not found',
            });
        }
        if (order_status?.paymentStatus === PaymentStatus.PAID) {
            req.body = { user, ...order_status }
            next();
        } else {
            return sendResponse(res, {
                statusCode: httpStatus.UNAUTHORIZED,
                success: false,
                message: "you're not authorized for the next step",
            });
        }
    } else {
        req.body = { user }
        next();
    }
}

export default authenticate_for_startProject
