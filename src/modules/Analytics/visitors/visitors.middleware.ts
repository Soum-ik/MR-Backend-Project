import httpStatus from "http-status"
import type { Request, Response, NextFunction } from "express"
import type { JwtPayload } from "jsonwebtoken"
import { verifyToken } from "../../../libs/authHelper"
import AppError from "../../../errors/AppError"
import { TUserRole } from "../../../modules/user/user.interface"
import catchAsync from "../../../libs/utlitys/catchSynch"
import { prisma } from "../../../libs/prismaHelper"

const authenticateToken = (...requiredRole: TUserRole[]) => {
    return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization;
        if (typeof authHeader === 'string') {
            const token = authHeader.split(' ')[1] || authHeader

            if (!token) {
                throw new AppError(httpStatus.UNAUTHORIZED, 'Unauthorized Access');
            }
            const decoded = verifyToken(token);

            if (!decoded) {
                throw new AppError(httpStatus.UNAUTHORIZED, 'Token is invalid');
            }

            const { role, email, id } = decoded as JwtPayload

            const user = await prisma.user.findUnique({
                where: {
                    email,
                    id
                }
            })

            if (!user) {
                throw new AppError(httpStatus.UNAUTHORIZED, 'Unauthorized Access... User not found!');
            }


            if (requiredRole.length > 0 && !requiredRole.includes(role)) {
                throw new AppError(httpStatus.FORBIDDEN, 'Forbidden Access');
            }

            const status = user.totalOrder === 0 ? "NEW_CLIENT" : "REPEATED_CLIENT";

            req.user = { status }
            next()
        } else {
            req.user = { status: "NEW_CLIENT" }
            next()
        }
    })
}
export default authenticateToken