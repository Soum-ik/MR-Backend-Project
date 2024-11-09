import httpStatus from "http-status";
import { prisma } from "../../../libs/prismaHelper";
import sendResponse from "../../../libs/sendResponse";
import { ExtendDeliveryParams } from "./ExtendDelivary.interface";
import { z } from "zod";
import { type Request, type Response } from "express";
import AppError from "../../../errors/AppError";
import { ExtendDeliveryMessage } from "./ExtendDelivary.constant";
import { TokenCredential } from "../../../libs/authHelper";
import { PaymentStatus } from "@prisma/client";

/*
test postman request

1. Extend Delivery (Client Request)
POST http://localhost:5000/api/v1/extend-delivery
Headers:
  Authorization: Bearer <your_jwt_token>
  Content-Type: application/json
Body:
{
  "orderId": "order123",
  "days": "5",
  "amount": "25",
  "requestedByClient": true,
  "reason": "Need more time for revisions"
}

2. Extend Delivery (Admin Request)
POST http://localhost:5000/api/v1/extend-delivery
Headers:
  Authorization: Bearer <your_jwt_token>
  Content-Type: application/json
Body:
{
  "orderId": "order123",
  "days": "3",
  "amount": "0",
  "requestedByClient": false,
  "reason": "Additional time needed for complex changes"
}

3. Approve Extension Request
POST http://localhost:5000/api/v1/extend-delivery/approve
Headers:
  Authorization: Bearer <your_jwt_token>
  Content-Type: application/json
Body:
{
  "extensionRequestId": "ext123",
  "approvedByAdmin": true
}

Response Format:
{
  "statusCode": 200,
  "success": true,
  "message": "Delivery date extended successfully",
  "data": {
    "id": "ext123",
    "orderId": "order123",
    "requestedByClient": true,
    "days": 5,
    "amount": "25",
    "reason": "Need more time for revisions",
    "paymentStatus": "COMPLETED",
    "adminApproved": null,
    "userApproved": true
  }
}
*/

const extendDelivery = async (req: Request, res: Response) => {
    try {
        const validatedBody = req.body as ExtendDeliveryParams;
        const { orderId, days, amount, requestedByClient, reason } = validatedBody;

        const user = req.user as TokenCredential

        // Fetch the order to extend
        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order) {
            throw new AppError(httpStatus.NOT_FOUND, 'Order not found');
        }

        // Calculate the new delivery date based on the requested days
        const newDeliveryDate = order.deliveryDate ? new Date(order.deliveryDate) : new Date();
        newDeliveryDate.setDate(newDeliveryDate.getDate() + parseInt(days, 10));

        // Handle client-initiated request
        if (requestedByClient) {
            // Calculate required payment for client
            const requiredAmount = parseInt(days, 10) * 5; // $5 per additional day

            if (amount !== requiredAmount.toString()) {
                return sendResponse(res, {
                    statusCode: httpStatus.BAD_REQUEST,
                    success: false,
                    message: `Incorrect amount. Please pay $${requiredAmount} for ${days} additional days.`,
                });
            }

            // Assume payment process here (integrate with payment gateway)
            const paymentSuccessful = true; // Placeholder for actual payment status

            if (!paymentSuccessful) {
                return sendResponse(res, {
                    statusCode: httpStatus.PAYMENT_REQUIRED,
                    success: false,
                    message: 'Payment failed. Please try again.',
                });
            }
        }

        // Create a new extension request entry
        const extensionRequest = await prisma.orderExtensionRequest.create({
            data: {
                orderId: orderId,
                requestedByClient,
                days: parseInt(days, 10),
                amount: amount,
                reason: reason || '',
                paymentStatus: requestedByClient ? PaymentStatus.COMPLETED : PaymentStatus.PENDING,
                adminApproved: requestedByClient ? null : true, // Auto-approved by admin if requested by admin
                userApproved: requestedByClient ? true : null    // Auto-approved by user if requested by user
            }
        });

        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: requestedByClient
                ? ExtendDeliveryMessage.EXTEND_DELIVERY_SUCCESS
                : ExtendDeliveryMessage.EXTEND_DELIVERY_FAILED,
            data: extensionRequest
        });
    } catch (error) {
        // Handle validation errors
        if (error instanceof z.ZodError) {
            return sendResponse(res, {
                statusCode: httpStatus.BAD_REQUEST,
                success: false,
                message: 'Validation failed',
                data: error.errors,
            });
        }

        // Handle other errors
        return sendResponse(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Internal server error',
        });
    }
};

// Controller for handling user/admin approval
const approveExtensionRequest = async (req: Request, res: Response) => {
    try {
        const { extensionRequestId, approvedByAdmin } = req.body;

        const extensionRequest = await prisma.orderExtensionRequest.findUnique({
            where: { id: extensionRequestId }
        });

        if (!extensionRequest) {
            throw new AppError(httpStatus.NOT_FOUND, 'Extension request not found');
        }

        // Update approval status based on who is approving
        const updatedRequest = await prisma.orderExtensionRequest.update({
            where: { id: extensionRequestId },
            data: {
                adminApproved: approvedByAdmin ? true : extensionRequest.adminApproved,
                userApproved: !approvedByAdmin ? true : extensionRequest.userApproved
            }
        });

        // Check if both approvals are done
        if (updatedRequest.adminApproved === true && updatedRequest.userApproved === true) {
            // Finalize the delivery date extension in the main order
            const order = await prisma.order.findUnique({
                where: { id: updatedRequest.orderId },
                select: { deliveryDate: true }
            });
            if (!order) {
                throw new AppError(httpStatus.NOT_FOUND, 'Order not found');
            }
            const finalNewDeliveryDate = new Date(order.deliveryDate || new Date());
            finalNewDeliveryDate.setDate(finalNewDeliveryDate.getDate() + updatedRequest.days);

            await prisma.order.update({
                where: { id: updatedRequest.orderId },
                data: { deliveryDate: finalNewDeliveryDate }
            });

            return sendResponse(res, {
                statusCode: httpStatus.OK,
                success: true,
                message: ExtendDeliveryMessage.EXTEND_DELIVERY_SUCCESS,
                data: updatedRequest
            });
        }

        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: ExtendDeliveryMessage.EXTEND_DELIVERY_FAILED,
            data: updatedRequest
        });
    } catch (error) {
        // Handle other errors
        return sendResponse(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Internal server error',
        });
    }
};

export { extendDelivery, approveExtensionRequest };
