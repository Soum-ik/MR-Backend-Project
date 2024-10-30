import { ErrorRequestHandler, Response } from 'express';
import httpStatus from 'http-status';
import { ZodError } from 'zod';
import { NODE_ENV } from '../config/config';
import AppError from '../errors/AppError';
import UnAuthorize from '../errors/unauthorizedError';


import { print } from '../helper/colorConsolePrint.ts/colorizedConsole';
import sendResponse from '../libs/sendResponse';

type THandleErrorFunc = (err: any, res?: Response) => AppError;
type THandleErrorResponse = (err: any, res: Response) => void;

const handlePrismaClientError: THandleErrorFunc = (error) => {
    const splitMessage = error.message.split('\n');
    const simplifiedMessage = splitMessage[splitMessage.length - 1];
    return new AppError(httpStatus.BAD_REQUEST, simplifiedMessage);
};

// handel Zod validation error
const handelValidationErrorDB: THandleErrorFunc = (err) => {
    try {
        const errors = Object.values(err.errors).map((el: any) => el.message);
        const message = `Invalid input data. ${errors.join('. ')}`;
        return new AppError(httpStatus.BAD_REQUEST, message);
    } catch (error) {
        return new AppError(httpStatus.BAD_REQUEST, err.message);
    }
};

const sendErrorProd: THandleErrorResponse = (err, res) => {
    if (!err.isOperational) {
        sendResponse(res, {
            statusCode: err.statusCode,
            success: false,
            message: 'Something went wrong',
        });
    } else {
        print.red('Error 💥', err);
        // 2. Send generic message to client
        sendResponse(res, {
            statusCode: err.statusCode,
            success: false,
            message: 'Something went wrong',
            error: {
                message: err.message,
            },
        });
    }
};

// send errorDevelopment to client
const sendErrorDev: THandleErrorResponse = (err, res) => {
    sendResponse(res, {
        statusCode: err.statusCode,
        success: false,
        error: {
            message: err.message,
            stack: err.stack,
        },
    });
};

// globalErrorHandler
const globalError: ErrorRequestHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
    err.status = err.status || 'error';

    if (err.name === 'ZodError' || err instanceof ZodError) {
        err = handelValidationErrorDB(err);
    } else if (
        err.name === 'PrismaClientValidationError' ||
        err.name === 'PrismaClientKnownRequestError'
    ) {
        err = handlePrismaClientError(err);
    } else if (err.name === 'TokenExpiredError') {
        err = new AppError(
            httpStatus.UNAUTHORIZED,
            'Token expired. Please log in again!',
        );
    } else if (err.name === 'JsonWebTokenError') {
        err = new AppError(
            httpStatus.UNAUTHORIZED,
            'Invalid token. Please log in again!',
        );
    } else if (err instanceof UnAuthorize) {
        err = new AppError(
            httpStatus.FORBIDDEN,
            'Unauthorized Access. You do not have the necessary permissions to access this resource.',
        );
    }

    if (NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else {
        sendErrorProd(err, res);
    }
};

export default globalError;
