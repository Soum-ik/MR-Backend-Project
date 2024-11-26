import { Socket } from 'socket.io';
import { prisma } from '../../libs/prismaHelper';
import socketStore from '../socket-store';

const updateSeenBy = (socket: Socket, io: any) => {
  socket.on('seen', async (data) => {
    const onlineUsers = socketStore.getOnlineUsers();

    const targetUserSocket = onlineUsers.find(
      (user) => user.userId === data.userId,
    );

    console.log('targetUserSocket', targetUserSocket);

    const message = await prisma.message.updateMany({
      where: {
        OR: [
          { recipientId: data.userId as string },
          { senderId: data.userId as string },
        ],
      },
      data: {
        seenBy: {
          push: data.userId,
        },
        seen: true,
      },
    });

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
  });
};
export default updateSeenBy;
