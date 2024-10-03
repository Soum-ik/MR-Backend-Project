import httpStatus from "http-status"
import type { Request, Response, NextFunction } from "express"
import type { JwtPayload } from "jsonwebtoken"
import { verifyToken } from "../libs/authHelper"
import sendResponse from "../libs/sendResponse"

const authenticateSuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
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
        if (user.role !== 'SUPER_ADMIN') {
            return sendResponse(res, {
                statusCode: httpStatus.FORBIDDEN,
                success: false,
                message: 'Access denied. Super Admin role required.',
            });
        }
        req.user = user;
        next();
    } else {
        sendResponse(res, {
            statusCode: httpStatus.FORBIDDEN,
            success: false,
            message: 'Authorization header is missing',
        });
    }
}
export default authenticateSuperAdmin
