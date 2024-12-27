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
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        const messageList = await prisma.orderMessage.findMany({
            where: {
                sendNotification: false,
                createdAt: {
                    gte: fiveMinutesAgo
                },
                read: false
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
                        id: true
                    }
                },
                messageText: true,
                uniqueId: true,
            }
        });

        if (messageList.length > 0) {
            const uniqueMessages = Array.from(new Map(messageList.map(message => [message.uniqueId, message])).values());

            await Promise.all(uniqueMessages.map(async (message) => {
                const { uniqueId, messageText, recipient: { role, id: RecipientId }, sender: { id: SenderId } } = message

                const userData = (await userFinder(RecipientId)) as User;

                const admins = ['ADMIN', 'SUPER_ADMIN', 'SUB_ADMIN'].includes(role)

                const payload = {
                    type: NotificationTypes.OrderMessage,
                    avatar: userData.image,
                    createdAt: new Date(),
                };

                await prisma.message.updateMany({
                    where: {
                        uniqueId: uniqueId
                    },
                    data: {
                        sendNotification: true
                    }
                })

                await prisma.notification.create({
                    data: {
                        recipient: admins ? 'USER' : 'ADMIN',
                        message: ``,
                        senderId: SenderId,
                        payload: payload,
                    },
                });
                PublicMessageHandler(
                    {
                        type: NotificationTypes.OrderMessage,
                        createdAt: new Date(),
                        senderUserName: userData.userName,
                        avatar: userData.image,
                        senderId: SenderId,
                    },
                    role,
                );


            })
            )
        }

    } catch (error) {
        print.red(`Error in scheduler: ${error}`, error);
    }
});
