import schedule from 'node-schedule';
import { NotificationTypes } from '../constants/Notification';
import { print } from '../helper/colorConsolePrint.ts/colorizedConsole';
import { twelveHoursDelivery } from '../helper/email/twelveHoursDelivery';
import { sendMail } from '../helper/smtp/AWS_SES';
import { prisma } from '../libs/prismaHelper';
import PublicMessageHandler from '../socket/handlers/PublicMessageHandler';

schedule.scheduleJob('* * * * * *', async () => {
  print.blue('Scheduler running to send order delivery reminder...');

  try {
    const now = new Date();
    const twelveHoursFromNow = new Date(now.getTime() + 12 * 60 * 60 * 1000);

    // Find messages with expired custom offers (created more than 48 hours ago)
    const orderList = await prisma.order.findMany({
      where: {
        isReminderDone: false,
        projectStatus: 'Ongoing',
        deliveryDate: {
          not: null,
          gt: now,
          lte: twelveHoursFromNow,
        },
      },
      select: {
        deliveryDate: true,
        projectNumber: true,
        projectName: true,
        userId: true,
        projectImage: true,
        user: true,
        id: true,
      },
    });

    if (orderList.length > 0) {
      await Promise.all(
        orderList.map(async (message) => {
          const { deliveryDate, projectNumber, projectName, user } = message;

          print.yellow(
            `Sending delivery reminder for project: ${projectNumber}.`,
          );

          try {
            const payload = {
              thumbnailUrl: message?.projectImage,
              type: NotificationTypes.Reminder,
              avatar: user?.image,
              senderUserName: user?.userName,
              projectNumber: message.projectNumber,
              projectName: message.projectName,
              createdAt: new Date(),
            };
            await prisma.notification.upsert({
              where: {
                projectNumber: message.projectNumber,
                recipient: 'ADMIN',
              },
              update: {
                recipient: 'ADMIN',
                message: ``,
                senderId: message.userId,
                payload: payload,
                createdAt: new Date(),
                isAdminSeen: [],
                isClientSeen: false,
              },
              create: {
                recipient: 'ADMIN',
                message: ``,
                senderId: message.userId,
                payload: payload,
                projectNumber: message.projectNumber,
              },
            });
            PublicMessageHandler(
              {
                msg: ``,
                avatar: user?.image,
                senderUserName: user?.userName,
                deliveryDate: deliveryDate,
                projectName: projectName,
                projectNumber: projectNumber,
                type: NotificationTypes.Reminder,
                createdAt: new Date(),
              },
              'USER',
            );

            const emailData = {
              clientName: user.userName,
              projectNumber: projectNumber,
            };

            await sendMail({
              to: 'bsns.mr.site@gmail.com',
              subject: `Your delivery deadline is coming up`,
              html: twelveHoursDelivery(emailData),
            });
            await prisma.order.update({
              where: {
                id: message.id,
              },
              data: {
                isReminderDone: true,
              },
            });

            print.green(
              `Delivery reminder sent for project: ${projectNumber}.`,
            );
          } catch (error) {
            print.red(
              `Error sending delivery reminder for project: ${projectNumber}.`,
              error,
            );
          }
        }),
      );
    }

    print.green(`${orderList.length} expired messages withdrawn.`);
  } catch (error) {
    print.red(`Error in scheduler: ${error}`, error);
  }
});
