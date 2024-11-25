import { Socket } from "socket.io";
import { prisma } from "../../libs/prismaHelper";

const updateSeenBy = (socket: Socket, io: any) => {
    socket.on('seen', async (data) => {
        try {
            // Validate `data.userId` exists
            if (!data?.userId) {
                throw new Error("User ID is required");
            }

            // Find messages that need to be updated
            const messagesToUpdate = await prisma.message.findMany({
                where: {
                    OR: [
                        { recipientId: data.userId as string },
                        { senderId: data.userId as string },
                    ],
                },
            });

            // Filter messages where `data.userId` is not already in `seenBy`
            const messagesNeedingUpdate = messagesToUpdate.filter(
                (message) => !message.seenBy.includes(data.userId)
            );

            // Update `seenBy` field for the filtered messages
            if (messagesNeedingUpdate.length > 0) {
                await Promise.all(
                    messagesNeedingUpdate.map((message) =>
                        prisma.message.update({
                            where: { id: message.id },
                            data: {
                                seenBy: {
                                    push: data.userId, // Adds userId to the seenBy array
                                },
                            },
                        })
                    )
                );
            }

            // Emit the updated data back to the clients
            io.emit('getSeenBy', { userId: data.userId, updatedMessages: messagesNeedingUpdate });
        } catch (error) {
            console.error("Error updating seenBy field:", error);
            socket.emit('error', { message: "Failed to update seenBy field", error: error });
        }
    });
};

export default updateSeenBy;
