// import { NextFunction } from 'express';
import httpStatus from 'http-status';
import { JwtPayload } from 'jsonwebtoken';
import { Socket } from 'socket.io';
import { verifyToken } from '../../libs/authHelper';
import sendSocketResponse from '../../libs/sendSocketResponse';
import { CustomSocket } from '../../Types';  // CustomSocket interface
import { prisma } from '../../libs/prismaHelper';

const authSocket = async (socket: CustomSocket, next: (err?: any) => void) => {
    try {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token || socket.handshake.headers.access_token;
         
        if (typeof token === 'string') {
            if (!token) {
                return sendSocketResponse(socket, {
                    statusCode: httpStatus.NOT_FOUND,
                    success: false,
                    message: 'Token not found',
                });
            }

            const decoded = verifyToken(token) as JwtPayload;

            if (!decoded) {
                return sendSocketResponse(socket, {
                    statusCode: httpStatus.FORBIDDEN,
                    success: false,
                    message: 'Token is invalid',
                });
            }

            const { user_id, role, email } = decoded;

            const user = await prisma.user.findUnique({
                where: { id: user_id, role, email },
            });



            // Attach the decoded token data (user) to the socket object
            socket.user = user as JwtPayload
            next(); // Continue to the next middleware or handler
        } else {
            return sendSocketResponse(socket, {
                statusCode: httpStatus.FORBIDDEN,
                success: false,
                message: 'Invalid token format',
            });
        }
    } catch (error) {
        console.error('Error in authSocket middleware:', error);
        return sendSocketResponse(socket, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Internal server error',
        });
    }
};


export { authSocket } 