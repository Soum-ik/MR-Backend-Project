import type { Request, Response } from "express";
import httpStatus from "http-status";
import sendResponse from "../../../libs/sendResponse";
import { TokenCredential } from "../../../libs/authHelper";
import { prisma } from "../../../libs/prismaHelper";
import catchAsync from "../../../libs/utlitys/catchSynch";
import AppError from "../../../errors/AppError";
import { adminUsers } from "../../../utils/adminUserId";

const CreateOrderNote = catchAsync(async (req: Request, res: Response) => {
    const { user_id, role } = req.user as TokenCredential;
    const { content, orderId } = req.body;


    if (!orderId) {
        throw new AppError(httpStatus.BAD_REQUEST, "Order ID is required!");
    }

    if (role === 'USER') {
        const findOrder = await prisma.order.findUnique({
            where: { id: orderId, userId: user_id as string }
        })
        if (!findOrder) {
            throw new AppError(httpStatus.NOT_FOUND, "Order not found! or you are not authorized to create note for this order");
        }
    }

    const createOrderNote = await prisma.note.create({
        data: {
            userId: user_id as string,
            orderId: orderId,
            content: content,
        }
    });

    return sendResponse<any>(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Order note created successfully",
        data: createOrderNote,
    });
})

const UpdateOrderNote = catchAsync(async (req: Request, res: Response) => {
    const { user_id } = req.user as TokenCredential;
    const { noteId, orderId } = req.params;

    const { content } = req.body;

    if (!user_id) {
        return sendResponse<any>(res, {
            statusCode: httpStatus.NOT_FOUND,
            success: false,
            message: "User token is required!",
        });
    }

    const updatedOrderNote = await prisma.note.update({
        where: { id: noteId, orderId: orderId, userId: user_id },
        data: {
            content: content,
        }
    });

    if (!updatedOrderNote) {
        throw new AppError(httpStatus.NOT_FOUND, "Order note not found!");
    }

    return sendResponse<any>(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Order note updated successfully",
        data: updatedOrderNote,
    });


})

const DeleteOrderNote = catchAsync(async (req: Request, res: Response) => {
    const { user_id, role } = req.user as TokenCredential;
    const { noteId, orderId } = req.params;

    if (!noteId && !orderId) {
        return sendResponse<any>(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: "Note ID and order ID are required to delete the note",
        });
    }
    const adminUser = await adminUsers()

    const deleteOrderNote = await prisma.note.delete({
        where: {
            id: noteId as string,
            orderId: orderId as string,
            ...(role === 'USER' ? { userId: user_id } : { userId: { in: adminUser } })
        },
    });

    if (!deleteOrderNote) {
        throw new AppError(httpStatus.NOT_FOUND, "Order note not found!");
    }

    return sendResponse<any>(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Order note deleted successfully, order title",
    });
})

const findOrderNote = catchAsync(async (req: Request, res: Response) => {
    const { user_id, role } = req.user as TokenCredential
    const { orderId } = req.params

    if (!orderId) {
        throw new AppError(httpStatus.BAD_REQUEST, "Order ID is required!");
    }

    const whereClause: { orderId: string; userId?: string | { in: string[] } } = {
        orderId: orderId as string
    }

    const adminUser = await adminUsers()
    if (role === 'USER') {
        whereClause.userId = user_id
    } else {
        whereClause.userId = { in: adminUser }
    }

    const findOrderNote = await prisma.note.findMany({
        where: whereClause
    })

    if (!findOrderNote) {
        return sendResponse<any>(res, {
            statusCode: httpStatus.NOT_FOUND,
            success: false,
            message: "Order note not found!",
        });
    }

    return sendResponse<any>(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Order note found successfully",
        data: findOrderNote
    })
})

export const OrderNoteController = {
    CreateOrderNote,
    UpdateOrderNote,
    DeleteOrderNote,
    findOrderNote
}
