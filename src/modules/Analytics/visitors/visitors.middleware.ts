import type { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import type { JwtPayload } from 'jsonwebtoken';
import AppError from '../../../errors/AppError';
import { verifyToken } from '../../../libs/authHelper';
import { prisma } from '../../../libs/prismaHelper';
import catchAsync from '../../../libs/utlitys/catchSynch';
import { TUserRole } from '../../../modules/user/user.interface';

const authenticateToken = (...requiredRole: TUserRole[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (typeof authHeader === 'string') {
      const token = authHeader.split(' ')[1] || authHeader;

      if (!token) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'Unauthorized Access');
      }
      const decoded = verifyToken(token);

      if (!decoded) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'Token is invalid');
      }

      //   const { role, email, id } = decoded as JwtPayload;
      const { role, email, user_id } = decoded as JwtPayload;

      const user = await prisma.user.findUnique({
        where: {
          email,
          id: user_id,
        },
      });

      if (!user) {
        throw new AppError(
          httpStatus.UNAUTHORIZED,
          'Unauthorized Access... User not found!',
        );
      }

      if (requiredRole.length > 0 && !requiredRole.includes(role)) {
        throw new AppError(httpStatus.FORBIDDEN, 'Forbidden Access');
      }

      const status = user.totalOrder === 0 ? 'NEW_CLIENT' : 'REPEATED_CLIENT';

      req.user = { status, role, user_id };
      next();
    } else {
      req.user = { status: 'NEW_CLIENT' };
      next();
    }
  });
};
export default authenticateToken;
