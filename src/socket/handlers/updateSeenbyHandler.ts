import { Socket } from "socket.io";
import { prisma } from "../../libs/prismaHelper";


const updateSeenBy = (socket: Socket, io: any) => {
    socket.on('seen', async (data) => {
        const message = await prisma.message.updateMany({
            where: {
                OR: [
                    { recipientId: data.userId as string },
                    { senderId: data.userId as string },
                ]
            },
            data: {
                seenBy: {
                    push: data.userId
                },
            },
        });

        io.emit('getSeenBy', message)
    })
}
export default updateSeenBy;
