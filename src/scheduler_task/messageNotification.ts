import schedule from 'node-schedule';
import { print } from '../helper/colorConsolePrint.ts/colorizedConsole';
import { prisma } from '../libs/prismaHelper';
import PublicMessageHandler from '../socket/handlers/PublicMessageHandler';
import { userFinder } from '../utils/userFinder';
import { User, Role } from '@prisma/client';
import { NotificationTypes } from '../constants/Notification';
import { sendMail } from '../helper/smtp/AWS_SES';
import { messagesTemplate } from '../helper/email/messagesTemplate';


schedule.scheduleJob('*/10 * * * * *', async () => {
    print.blue('Scheduler running to sending notification...');

    try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        // const fiveSecondsAgo = new Date(Date.now() - 10 * 1000);


        const messageList = await prisma.message.findMany({
            where: {
                sendNotification: false,
                createdAt: {
                    lte: fiveMinutesAgo
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
                        role: true,
                    }
                },
                messageText: true,
                uniqueId: true,
                isFromClient: true,
                attachment: true
            }
        });

        console.log(messageList, 'messagelist for testing  corn', messageList.length);


        if (messageList.length > 0) {
            const uniqueMessages = Array.from(new Map(messageList.map(message => [message.uniqueId, message])).values());

            await Promise.all(uniqueMessages.map(async (message) => {

                const { uniqueId, messageText, sender: { id: SenderId, role, userName }, isFromClient, attachment } = message

                const userData = (await userFinder(SenderId)) as User;


                const emailData = {
                    clientName: userData.userName,
                    messageText: messageText,
                    attachment
                }

                await sendMail({
                    to: 'sarkarsoumik215@gmail.com',
                    subject: `You've recieved messages from ${emailData.clientName}`,
                    html: messagesTemplate(
                        emailData
                    ),
                });

                await prisma.message.updateMany({
                    where: {
                        uniqueId: uniqueId
                    },
                    data: {
                        sendNotification: true
                    }
                })
            })
            )
        }

    } catch (error) {
        print.red(`Error in scheduler: ${error}`, error);
    }
});
