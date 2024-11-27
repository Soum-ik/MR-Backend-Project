import httpStatus from 'http-status';
import { Socket } from 'socket.io';
import AppError from '../../errors/AppError';
import { prisma } from '../../libs/prismaHelper';
import socketStore from '../socket-store';

const updateSeenBy = (socket: Socket, io: any) => {
  socket.on('seen', async (data) => {
    try {
      const user = socket.user;

      const onlineUsers = socketStore.getOnlineUsers();

      const targetUserSocket = onlineUsers.find(
        (user) => user.userId === data.userId,
      );

      // Use a transaction for efficiency
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { recipientId: data.userId as string },
            { senderId: data.userId as string },
          ],
        },
      });

      if (messages.length === 0) {
        return new AppError(httpStatus.NOT_FOUND, 'No messages');
      }

      if (['ADMIN', 'SUPER_ADMIN', 'SUB_ADMIN'].includes(user.role)) {
        await prisma.message.updateMany({
          where: {
            OR: [
              { recipientId: data.userId, senderId: data.recipientId },
              { recipientId: data.recipientId, senderId: data.userId },
            ],
          },
          data: {
            isAdminSeen: true,
          },
        });
      }

      // const uniqueUpdates = [];

      // for (const message of messages) {
      //   // Check if userId is already in seenBy
      //   if (!message.seenBy.includes(data.userId)) {
      //     uniqueUpdates.push(
      //       prisma.message.update({
      //         where: { id: message. },
      //         data: {
      //           seenBy: {
      //             push: data.userId,
      //           },
      //           seen: true,
      //         },
      //       }),
      //     );
      //   }
      // }

      // Execute all updates in parallel
      // await prisma.$transaction(uniqueUpdates);

      // Fetch the updated latest message for the recipient
      const messageData = await prisma.message.findMany({
        where: {
          OR: [
            { recipientId: data?.recipientId as string },
            { senderId: data?.recipientId as string },
          ],
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      io.to(targetUserSocket?.socketId).emit('getSeenBy', messageData[0]);
    } catch (error) {
      console.error('Error updating seenBy:', error);
    }
  });
};

export default updateSeenBy;
