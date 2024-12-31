import schedule from 'node-schedule';
import { print } from '../helper/colorConsolePrint.ts/colorizedConsole';
import { prisma } from '../libs/prismaHelper';
import PublicMessageHandler from '../socket/handlers/PublicMessageHandler';
import { userFinder } from '../utils/userFinder';
import { User } from '@prisma/client';
import { NotificationTypes } from '../constants/Notification';


schedule.scheduleJob('*/10 * * * * *', async () => {
    print.blue('Scheduler running to sending order message notification...');

    try {
        // const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const fiveSecondsAgo = new Date(Date.now() - 10 * 1000);

        const messageList = await prisma.orderMessage.findMany({
            where: {
                sendNotification: false,
                createdAt: {
                    gte: fiveSecondsAgo
                },
                NOT: {
                    AND: [
                        { isAdminSeen: true },
                        { isClientSeen: true }
                    ]
                }
            },
            select: {
                recipient: {
                    select: {
                        role: true,
                        id: true,
                        userName: true,
                        email: true,
                        image: true,
                    }
                },
                sender: {
                    select: {
                        userName: true,
                        email: true,
                        image: true,
                        id: true,
                    }
                },
                messageText: true,
                uniqueId: true,
                isFromAdmin: true,
                isFromClient: true,
            }
        });

        if (messageList.length > 0) {
            const uniqueMessages = Array.from(new Map(messageList.map(message => [message.uniqueId, message])).values());

            await Promise.all(uniqueMessages.map(async (message) => {

                const { uniqueId, messageText, sender: { id: SenderId, userName }, isFromClient } = message

                const userData = (await userFinder(SenderId)) as User;


                const payload = {
                    type: NotificationTypes.Message,
                    avatar: userData.image,
                    message: messageText,
                    createdAt: new Date(),
                };

                // await prisma.notification.create({
                //     data: {
                //         recipient: isFromClient ? "ADMIN" : "USER",
                //         message: messageText,
                //         senderId: SenderId,
                //         payload: payload,
                //     },
                // });

                // PublicMessageHandler(
                //     {
                //         type: NotificationTypes.Message,
                //         createdAt: new Date(),
                //         senderUserName: userData.userName,
                //         avatar: userData.image,
                //         senderId: SenderId,
                //         message: messageText
                //     },
                //     isFromClient ? "USER" : "ADMIN"
                // );

                // await prisma.message.updateMany({
                //     where: {
                //         uniqueId: uniqueId
                //     },
                //     data: {
                //         sendNotification: true
                //     }
                // })
            })
            )
        }

    } catch (error) {
        print.red(`Error in scheduler: ${error}`, error);
    }
});
