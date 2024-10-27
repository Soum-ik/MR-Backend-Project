import httpStatus, { NOT_FOUND } from "http-status"
import type { Request, Response, NextFunction } from "express"
import type { JwtPayload } from "jsonwebtoken"
import { verifyToken } from "../libs/authHelper"
import sendResponse from "../libs/sendResponse"
 
const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (typeof authHeader === 'string') {
        const token = authHeader.split(' ')[1] || authHeader

        if (!token) {
            return sendResponse(res, {
                statusCode: NOT_FOUND,
                success: false,
                message: 'Token not found'
            });
        }
        const decoded = verifyToken(token);
        // console.log(decoded, "testing decoded");

        if (!decoded) {
            return sendResponse(res, {
                statusCode: httpStatus.FORBIDDEN,
                success: false,
                message: 'Token is invalid',
            });
        }

        // const find = await prisma.user.findUnique({
        //     where: {
        //         email: decoded.email,
        //         id: decoded.user_id
        //     }, select: {
        //         role: true,
        //         email: true,
        //     }
        // })



        req.user = decoded as JwtPayload
        next()
    } else {
        sendResponse(res, {
            statusCode: httpStatus.FORBIDDEN,
            success: false,
            message: 'Something want wrong token',
        });
    }
}
export default authenticateToken




