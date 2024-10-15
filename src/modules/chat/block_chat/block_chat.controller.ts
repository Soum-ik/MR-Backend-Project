import type { Request, Response } from "express";
import httpStatus from "http-status";
import { z } from "zod";
import sendResponse from "../../../libs/sendResponse";
import { prisma } from "../../../libs/prismaHelper";
import { Prisma } from "@prisma/client";


const block_user = async (req: Request, res: Response) => {
	try {
		const { user_id } = req.params;

		if (!user_id) {
			return sendResponse(res, {
				statusCode: httpStatus.BAD_REQUEST,
				success: false,
				message: "User ID is required",
			});
		}

		const user = await prisma.user.findUnique({
			where: { id: user_id },
			select: { block_for_chat: true }
		});

		if (!user) {
			return sendResponse(res, {
				statusCode: httpStatus.NOT_FOUND,
				success: false,
				message: "User not found",
			});
		}

		const updatedUser = await prisma.user.update({
			where: { id: user_id },
			data: { block_for_chat: !user.block_for_chat }
		});

		return sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: `User ${updatedUser.block_for_chat ? 'blocked' : 'unblocked'} for chat successfully. User ID: ${updatedUser.id}, User Name: ${updatedUser.userName}`,
			data: { block_for_chat: updatedUser.block_for_chat }
		});

	} catch (error) {
		console.error("Error in user_chat_block: ", error);

		if (error instanceof z.ZodError) {
			return sendResponse(res, {
				statusCode: httpStatus.BAD_REQUEST,
				success: false,
				message: "Validation failed",
				data: { errors: error.errors },
			});
		}

		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			if (error.code === 'P2002') {
				return sendResponse(res, {
					statusCode: httpStatus.CONFLICT,
					success: false,
					message: "A unique constraint would be violated on User",
				});
			}
		}

		return sendResponse(res, {
			statusCode: httpStatus.INTERNAL_SERVER_ERROR,
			success: false,
			message: "An unexpected error occurred",
		});
	}
}

const get_blocked_users = async (req: Request, res: Response) => {
	try {

		const blockedUsers = await prisma.user.findMany({
			where: {
				block_for_chat: true
			}
		})


		if (blockedUsers.length === 0) {
			return sendResponse(res, {
				statusCode: httpStatus.NOT_FOUND,
				success: false,
				message: "No blocked users found",
			});
		}

		return sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "Blocked users retrieved successfully",
			data: blockedUsers
		});

	} catch (error) {
		console.error("Error in user_chat_block: ", error);

		if (error instanceof z.ZodError) {
			return sendResponse(res, {
				statusCode: httpStatus.BAD_REQUEST,
				success: false,
				message: "Validation failed",
				data: { errors: error.errors },
			});
		}

		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			if (error.code === 'P2002') {
				return sendResponse(res, {
					statusCode: httpStatus.CONFLICT,
					success: false,
					message: "A unique constraint would be violated on User",
				});
			}
		}

		return sendResponse(res, {
			statusCode: httpStatus.INTERNAL_SERVER_ERROR,
			success: false,
			message: "An unexpected error occurred",
		});
	}
}

export const blockChatController = {
	get_blocked_users,
	block_user
}
