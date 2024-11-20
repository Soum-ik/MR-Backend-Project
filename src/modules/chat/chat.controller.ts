import { Request, Response } from "express";
import httpStatus from "http-status";
import { prisma } from "../../libs/prismaHelper";
import sendResponse from "../../libs/sendResponse";
import catchAsync from "../../libs/utlitys/catchSynch";

const AvaiableForChat = catchAsync(async (req: Request, res: Response) => {
	// Fetch all users with contactForChat relationships
	const listOfUser = await prisma.user.findMany({
		include: {
			contactForChat: true,
		},
		where: {
			contactForChat: {
				some: {},
			},
		},
	});

	// Fetch user messages and process users asynchronously
	const filteredUsers = await Promise.all(
		listOfUser.map(async (user) => {
			// Fetch messages for each user
			const userMessages = await prisma.message.findMany({
				where: {
					senderId: user.id,
				},
				orderBy: {
					createdAt: "desc", // Fetch the most recent message
				},
				select: {
					messageText: true,
					seen: true,
					commonkey: true,
					createdAt: true
				}
			});


			const lastMessage =
				userMessages.length > 0
					? userMessages[0]
					: {
						messageText: "New Contact form submitted",
						seen: false,
						commonkey: null,
						createdAt: new Date(),
					};
			const seenCommonKeys = new Set();
			const totalUnseenMessage = userMessages.filter((message) => {
				if (!message.seen && !seenCommonKeys.has(message.commonkey)) {
					seenCommonKeys.add(message.commonkey); // Add the commonkey to the set if it's unseen and unique
					return true;
				}
				return false;
			}).length;



			const status = user.totalOrder === 0 ? "New Client" : "Repeated Client";

			return {
				fullName: user.fullName,
				image: user.image,
				createdAt: user.createdAt,
				contactForChat: user.contactForChat,
				totalOrder: user.totalOrder,
				userName: user.userName,
				id: user.id,
				status: status,
				isBlocked: user.block_for_chat,
				isArchived: user.archive,
				isBookMarked: user.book_mark,
				lastmessageinfo: {
					...lastMessage,
					totalUnseenMessage,
				}
			};
		})
	);

	const totalUser = filteredUsers.length;


	if (totalUser === 0) {
		return sendResponse<any>(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "There is no user available for chat",
			data: null,
		});
	}
	const sortedUsers = filteredUsers.sort((a, b) => {
        const dateA = new Date(a.lastmessageinfo.createdAt);
        const dateB = new Date(b.lastmessageinfo.createdAt);
        return dateB.getTime() - dateA.getTime(); // Sort in descending order (newest first)
    });
	
	return sendResponse<any>(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Users with contactForChat retrieved successfully",
		data: filteredUsers,
	});
});

export const chating = {
	AvaiableForChat,
};
