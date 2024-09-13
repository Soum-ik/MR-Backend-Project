import { Socket } from "socket.io";

// Same interface as for the API response
type IApiResponse<T> = {
    statusCode: number;
    success: boolean;
    message?: string | null;
    data?: T | null;
    meta?: {
        page: number;
        limit: number;
        total: number;
    } | null;
};

// Function for sending a response via socket events
const sendSocketResponse = <T>(socket: Socket, data: IApiResponse<T>): void => {
    const responseData: IApiResponse<T> = {
        statusCode: data.statusCode,
        success: data.success,
        message: data.message || null,
        data: data.data || null,
        meta: data.meta || null,
    };

    // Emit the response data to the client via a socket event, e.g., "response"
    socket.emit('response', responseData);
};

export default sendSocketResponse;
