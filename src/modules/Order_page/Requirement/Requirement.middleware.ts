import httpStatus from "http-status"
import type { Request, Response, NextFunction } from "express"
import type { JwtPayload } from "jsonwebtoken"
import sendResponse from "../../../libs/sendResponse";
import { verifyToken } from "../../../libs/authHelper";
import { prisma } from "../../../libs/prismaHelper";


const authenticate_for_startProject = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (typeof authHeader === 'string') {
        const token = authHeader.split(' ')[1] || authHeader

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

        const userData = await prisma.payment.findUnique({
            where: {
                id: user.id
            }
        })

        if (userData) {
            console.log("Payment are done able to start the project");
            req.user = { userData, ...user };
            next();
        } else {
            sendResponse(res, {
                statusCode: httpStatus.FORBIDDEN,
                success: false,
                message: "You're not able go for next step",
            });
        }
    } else {
        sendResponse(res, {
            statusCode: httpStatus.FORBIDDEN,
            success: false,
            message: 'Authorization header is missing',
        });
    }
}
export default authenticate_for_startProject
