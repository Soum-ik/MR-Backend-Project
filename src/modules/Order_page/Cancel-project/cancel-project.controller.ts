import type { Request, Response } from 'express';
import { getPrismaFilter } from '../../../middleware/filterData';
import { prisma } from '../../../libs/prismaHelper';
import { z } from 'zod';
import httpStatus from 'http-status';
import sendResponse from '../../../libs/sendResponse';
import { ProjectStatus } from '../Order_page.constant';
import { OrderStatus } from '../Order_page.constant';

/*
API Documentation for Testing in Postman:

1. Cancel Project API
-----------------------
Endpoint: POST /api/cancel-project
Request Body:
{
    "orderId": "65f1234567890abcdef12345",  // MongoDB ObjectId
    "cancelOffer": {                         // Optional
        "reason": "Project requirements changed"
    }
}

Response (Success - With Cancel Offer):
{
    "statusCode": 200,
    "success": true,
    "message": "Cancellation offer sent to client",
    "data": {
        // Order details with updated submittedData
    }
}

Response (Success - Direct Cancellation):
{
    "statusCode": 200,
    "success": true,
    "message": "Project cancelled successfully",
    "data": {
        // Updated order details
    }
}

2. Handle Client Response API
----------------------------
Endpoint: POST /api/handle-client-response
Request Body:
{
    "orderId": "65f1234567890abcdef12345",  // MongoDB ObjectId
    "response": "ACCEPT"  // Can be either "ACCEPT" or "REJECT"
}

Response (Success - Accepted):
{
    "statusCode": 200,
    "success": true,
    "message": "Cancellation accepted",
    "data": {
        // Updated order details
    }
}

Response (Success - Rejected):
{
    "statusCode": 200,
    "success": true,
    "message": "Cancellation rejected",
    "data": {
        // Updated order details
    }
}

Error Responses (Both APIs):
{
    "statusCode": 404,
    "success": false,
    "message": "Order not found"
}

{
    "statusCode": 400,
    "success": false,
    "message": "Validation error details",
    "data": null
}

{
    "statusCode": 500,
    "success": false,
    "message": "Internal server error",
    "data": null
}
*/

// Validation schema for cancel request
const cancelProjectSchema = z.object({
    orderId: z.string(),
    cancelOffer: z.object({
        reason: z.string().optional()
    }).optional()
});

// Validation schema for client response
const clientResponseSchema = z.object({
    orderId: z.string(),
    response: z.enum(['ACCEPT', 'REJECT'])
});

export const CancelProject = async (req: Request, res: Response) => {
    try {
        const { orderId, cancelOffer } = cancelProjectSchema.parse(req.body);

        // Get the order
        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order) {
            return sendResponse(res, {
                statusCode: httpStatus.NOT_FOUND,
                success: false,
                message: 'Order not found'
            });
        }

        if (cancelOffer) {
            // Send cancellation offer to client
            const updatedOrder = await prisma.order.update({
                where: { id: orderId },
                data: {
                    submittedData: {
                        reason: cancelOffer.reason,
                        status: 'PENDING'
                    }
                }
            });

            return sendResponse(res, {
                statusCode: httpStatus.OK,
                success: true,
                message: 'Cancellation offer sent to client',
                data: updatedOrder
            });

        } else {
            // Direct cancellation by admin
            const cancelledOrder = await prisma.order.update({
                where: { id: orderId },
                data: {
                    projectStatus: ProjectStatus.CANCELED,
                    trackProjectStatus: 'CANCELLED'
                }
            });

            return sendResponse(res, {
                statusCode: httpStatus.OK,
                success: true,
                message: 'Project cancelled successfully',
                data: cancelledOrder
            });
        }

    } catch (error) {
        if (error instanceof z.ZodError) {
            return sendResponse<any>(res, {
                statusCode: httpStatus.BAD_REQUEST,
                success: false,
                data: null,
                message: `${error.message}`,
            });
        }

        return sendResponse<any>(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            data: null,
            message: `Internal server error`,
        });
    }
}

// Handle client's response to cancellation offer
export const handleClientResponse = async (req: Request, res: Response) => {
    try {
        const { orderId, response } = clientResponseSchema.parse(req.body);

        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order) {
            return sendResponse(res, {
                statusCode: httpStatus.NOT_FOUND,
                success: false,
                message: 'Order not found'
            });
        }

        if (response === 'ACCEPT') {
            const updatedOrder = await prisma.order.update({
                where: { id: orderId },
                data: {
                    projectStatus: ProjectStatus.CANCELED,
                    trackProjectStatus: 'CANCELLED',

                }
            });

            return sendResponse(res, {
                statusCode: httpStatus.OK,
                success: true,
                message: 'Cancellation accepted',
                data: updatedOrder
            });
        } else {
            const updatedOrder = await prisma.order.update({
                where: { id: orderId },
                data: {
                    submittedData: {
                        status: 'REJECTED'
                    }
                }
            });

            return sendResponse(res, {
                statusCode: httpStatus.OK,
                success: true,
                message: 'Cancellation rejected', 
                data: updatedOrder
            });
        }

    } catch (error) {
        if (error instanceof z.ZodError) {
            return sendResponse<any>(res, {
                statusCode: httpStatus.BAD_REQUEST,
                success: false,
                data: null,
                message: `${error.message}`,
            });
        }

        return sendResponse<any>(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            data: null,
            message: `Internal server error`,
        });
    }
}
