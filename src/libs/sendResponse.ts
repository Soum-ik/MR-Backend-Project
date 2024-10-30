import { type Response } from "express";

type IApiResponse<T> = {
    statusCode: number;
    success: boolean;
    message?: string | null;
    error?: T | null;
    data?: T | null;
    meta?: {
        page: number;
        limit: number;
        total: number;
    } | null;
};

const sendResponse = <T>(res: Response, data: IApiResponse<T>): void => {
    const responseData: IApiResponse<T> = {
        statusCode: data.statusCode,
        success: data.success,
        error: data.error || null,
        message: data.message || null,
        data: data.data || null,
        meta: data.meta || null,
    };

    res.status(data.statusCode).json(responseData);
};

export default sendResponse;