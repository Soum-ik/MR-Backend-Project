import type { Request, Response } from "express";
import httpStatus from "http-status";
import sendResponse from "../../../libs/sendResponse";
import { TokenCredential } from "../../../libs/authHelper";
import { prisma } from "../../../libs/prismaHelper";
import { z } from "zod";

const CreateOrderNote = async (req: Request, res: Response) => {
    const { user_id } = req.user as TokenCredential;
    const { content, orderId } = req.body;

    if (!user_id) {
        return sendResponse<any>(res, {
            statusCode: httpStatus.NOT_FOUND,
            success: false,
            message: "User token is required!",
        });
    }

    try {

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

    } catch (error) {
        if (error instanceof z.ZodError) {
            return sendResponse<any>(res, {
                statusCode: httpStatus.BAD_GATEWAY,
                success: false,
                message: "Validation error",
                data: error,
            });
        }

        return sendResponse<any>(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: "An unexpected error occurred",
            data: error,
        });
    }
}

const UpdateOrderNote = async (req: Request, res: Response) => {
    const { user_id } = req.user as TokenCredential;
    const { noteId, note, orderId } = req.body;

    if (!user_id) {
        return sendResponse<any>(res, {
            statusCode: httpStatus.NOT_FOUND,
            success: false,
            message: "User token is required!",
        });
    }

    const noteSchema = z.object({
        content: z.object({
            title: z.string(),
            note: z.string(),
        })
    });

    try {
        const validatedNote = noteSchema.parse(note);

        const updatedOrderNote = await prisma.note.update({
            where: { id: noteId, orderId: orderId },
            data: {
                content: validatedNote.content,
            }
        });

        return sendResponse<any>(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Order note updated successfully",
            data: updatedOrderNote,
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return sendResponse<any>(res, {
                statusCode: httpStatus.BAD_GATEWAY,
                success: false,
                message: "Validation error",
                data: error,
            });
        }

        return sendResponse<any>(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: "An unexpected error occurred",
            data: error,
        });
    }
}

const DeleteOrderNote = async (req: Request, res: Response) => {
    const { user_id } = req.user as TokenCredential;
    const { noteId, orderId } = req.query;

    if (!user_id) {
        return sendResponse<any>(res, {
            statusCode: httpStatus.NOT_FOUND,
            success: false,
            message: "User token is required!",
        });
    }

    if (!noteId && !orderId) {
        return sendResponse<any>(res, {
            statusCode: httpStatus.BAD_REQUEST,
            success: false,
            message: "Note ID and order ID are required! to delete the note",
        });
    }

    try {
        await prisma.note.delete({
            where: { id: noteId as string, orderId: orderId as string }
        });

        return sendResponse<any>(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Order note deleted successfully, order title %{}",
        });

    } catch (error) {
        return sendResponse<any>(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: "An unexpected error occurred",
            data: error,
        });
    }
}

const findOrderNote = async (req: Request, res: Response) => {
    const { user_id } = req.user as TokenCredential

    const { orderId } = req.params

    try {
        const findOrderNote = await prisma.note.findMany({
            where: {
                userId: user_id as string,
                orderId: orderId as string
            }
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

    } catch (error) {

        if (error instanceof z.ZodError) {
            return sendResponse<any>(res, {
                statusCode: httpStatus.BAD_GATEWAY,
                success: false,
                message: "Validation error",
                data: error,
            });
        }

        return sendResponse<any>(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: "An unexpected error occurred",
            data: error,
        });
    }
}

export const OrderNoteController = {
    CreateOrderNote,
    UpdateOrderNote,
    DeleteOrderNote,
    findOrderNote
}
