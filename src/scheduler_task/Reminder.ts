import schedule from 'node-schedule';
import { print } from '../helper/colorConsolePrint.ts/colorizedConsole';
import { prisma } from '../libs/prismaHelper';
import PublicMessageHandler from '../socket/handlers/PublicMessageHandler';
import { NotificationTypes } from '../constants/Notification';



schedule.scheduleJob('*/10 * * * * *', async () => {
    print.blue('Scheduler running to send order delivery reminder...');

    try {
        // Get the current date and time
        const now = new Date();

        // Find messages with expired custom offers (created more than 48 hours ago)
        const orderList = await prisma.order.findMany({
            where: {
                projectStatus: 'Ongoing',
                deliveryDate:
                {
                    equals: new Date(now.getTime() + 12 * 60 * 60 * 1000)
                },
            },
            select: {
                deliveryDate: true,
                projectNumber: true,
                projectName: true,
                userId: true,
                projectImage: true,
            },
        });



        if (orderList.length > 0) {
            await Promise.all(
                orderList.map(async (message) => {
                    const { deliveryDate, projectNumber, projectName } = message;

                    print.yellow(`Sending delivery reminder for project: ${projectNumber}.`);

                    try {
                        const payload = {
                            thumbnailUrl: message?.projectImage,
                            type: NotificationTypes.Order,
                            projectNumber: message.projectNumber,
                            projectName: message.projectName,
                            createdAt: new Date(),
                        }
                        await prisma.notification.create({
                            data: {
                                recipient: 'ADMIN',
                                message: ``,
                                senderId: message.userId,
                                payload: payload,

                            }
                        })
                        PublicMessageHandler({
                            msg: ``,
                            deliveryDate: deliveryDate,
                            projectName: projectName,
                            projectNumber: projectNumber,
                            type: NotificationTypes.Reminder,
                            createdAt: new Date(),
                        }, 'USER');



                        print.green(`Delivery reminder sent for project: ${projectNumber}.`);
                    } catch (error) {
                        print.red(`Error sending delivery reminder for project: ${projectNumber}.`, error);
                    }
                })
            );
        }


        print.green(`${orderList.length} expired messages withdrawn.`);
    } catch (error) {
        print.red(`Error in scheduler: ${error}`, error);
    }
});


