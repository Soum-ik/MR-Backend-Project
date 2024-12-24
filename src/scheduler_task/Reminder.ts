import schedule from 'node-schedule';
import { print } from '../helper/colorConsolePrint.ts/colorizedConsole';
import { prisma } from '../libs/prismaHelper';
import PublicMessageHandler from '../socket/handlers/PublicMessageHandler';
import { NotificationTypes } from '../constants/Notification';



schedule.scheduleJob('*/10 * * * *', async () => {
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
                    lte: new Date(now.getTime() + 12 * 60 * 60 * 1000)
                }
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
                    const payload = {
                        thumbnailUrl: message?.projectImage,
                        type: NotificationTypes.Order,
                        projectNumber: message.projectNumber,
                        projectName: message.projectName,
                        createdAt: new Date(),
                    }
                    print.yellow(`Sending delivery reminder for project: ${projectNumber}.`);

                    try {
                        await prisma.notification.create({
                            data: {
                                recipient: 'ADMIN',
                                message: ` <div className="flex-1">
        <p className="text-sm font-medium sm:text-base text-gray-900 line-clamp-3">
          <span className="font-bold">Reminder: </span>
          the delivery is due in less than 12 hours
          <span className="font-bold"> Deliver Now</span>
        </p>
      </div>
                   `,
                                senderId: message.userId,
                                payload: payload,

                            }
                        })
                        PublicMessageHandler({
                            msg: `
                            <div className="flex-1">
        <p className="text-sm font-medium sm:text-base text-gray-900 line-clamp-3">
          <span className="font-bold">Reminder: </span>
          the delivery is due in less than 12 hours
          <span className="font-bold"> Deliver Now</span>
        </p>
      </div>
                    `,
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


