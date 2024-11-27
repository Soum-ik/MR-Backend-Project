import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { prisma } from '../../libs/prismaHelper';
import sendResponse from '../../libs/sendResponse';
import catchAsync from '../../libs/utlitys/catchSynch';
const AvaiableForChat = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
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
          OR: [
            {
              senderId: user.id,
              recipient: {
                role: {
                  in: ['ADMIN', 'SUB_ADMIN', 'SUPER_ADMIN'],
                },
              },
            },
            {
              recipientId: user.id,
              sender: {
                role: {
                  in: ['ADMIN', 'SUB_ADMIN', 'SUPER_ADMIN'],
                },
              },
            },
          ],
        },
        orderBy: {
          createdAt: 'desc', // Fetch the most recent message
        },
      });

      const lastMessage =
        userMessages.length > 0
          ? userMessages[0]
          : {
              messageText: '',
              seen: true,
              commonkey: null,
              createdAt: null,
            };
      // const totalUnseenMessage = userMessages.filter(message =>
      //   !message.seen && message.seenBy && !message.seenBy.includes(user.id)
      // ).length;
      const totalUnseenMessage = userMessages.filter(
        (message) => message.recipientId === id && !message.isAdminSeen,
      ).length;

      const status = user.totalOrder === 0 ? 'New Client' : 'Repeated Client';

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
          timeAndDate: userMessages[0]?.timeAndDate,
          totalUnseenMessage,
          ...lastMessage,
        },
      };
    }),
  );

  const totalUser = filteredUsers.length;

  if (totalUser === 0) {
    return sendResponse<any>(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'There is no user available for chat',
      data: null,
    });
  }

  // sort by last message timestamp
  const sortedUsers = filteredUsers.sort((a, b) => {
    const dateA = a.lastmessageinfo.createdAt
      ? new Date(a.lastmessageinfo.createdAt).getTime()
      : new Date(a.createdAt).getTime();
    const dateB = b.lastmessageinfo.createdAt
      ? new Date(b.lastmessageinfo.createdAt).getTime()
      : new Date(b.createdAt).getTime();

    return dateB - dateA;
  });

  return sendResponse<any>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Users with contactForChat retrieved successfully',
    data: sortedUsers,
  });
});

export const chating = {
  AvaiableForChat,
};
