import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import { prisma } from '../../libs/prismaHelper';
import sendResponse from '../../libs/sendResponse';
import { z } from 'zod';

const AvaiableForChat = async (req: Request, res: Response) => {
	try {

		const status = ['FirstTime', 'RepeatedClient', 'multipulTime']

		const listOfUser = await prisma.user.findMany({
			include: {
				contactForChat: true,  // Include contactForChat data
			},
		});




		// Filter out users whose contactForChat is null or empty
		const usersWithContact = listOfUser.filter((user) => user.contactForChat !== null);

		// Select only the required fields
		const filteredUsers = usersWithContact.map(user => {
			const status = user.totalOrder === 0 ? 'New Client' : 'Repeated Client';

			return {
				fullName: user.fullName,
				image: user.image,
				createdAt: user.createdAt,
				contactForChat: user.contactForChat, // Include contactForChat if needed
				totalOrder: user.totalOrder,
				status: status // Add the status field
			};
		});

		const totalUser = filteredUsers.length


		if (totalUser === 0) {
			return sendResponse<any>(res, {
				statusCode: httpStatus.OK,
				success: true,
				message: 'There is no user avaiable for chat',
				data: null
			});
		}


		return sendResponse<any>(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: 'Users with contactForChat retrieved successfully',
			data: filteredUsers
		});

	} catch (error) {
		if (error instanceof z.ZodError) {
			return sendResponse(res, {
				statusCode: httpStatus.BAD_REQUEST,
				success: false,
				message: 'Validation failed',
				data: null
			});
		}

		return sendResponse(res, {
			statusCode: httpStatus.INTERNAL_SERVER_ERROR,
			success: false,
			message: 'Internal server error',
		});
	}
};

export const chating = {
	AvaiableForChat
};
