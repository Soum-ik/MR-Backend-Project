import { User } from '@prisma/client';
import schedule from 'node-schedule';
import { NotificationTypes } from '../constants/Notification';
import { print } from '../helper/colorConsolePrint.ts/colorizedConsole';
import { prisma } from '../libs/prismaHelper';
import { cancelProjectT } from '../modules/payment/payment.interface';
import PublicMessageHandler, {
  ADMINLOGO,
} from '../socket/handlers/PublicMessageHandler';
import { userFinder } from '../utils/userFinder';

function iscancelProjectT(offer: unknown): offer is cancelProjectT {
  if (typeof offer !== 'object' || offer === null) return false;

  const maybeOffer = offer as Partial<cancelProjectT>;

  return (
    maybeOffer.isAccepted === false &&
    maybeOffer.isRejected === false &&
    maybeOffer.isWithdrawn === false
  );
}

schedule.scheduleJob('*/10  * * * * *', async () => {
  print.blue('Scheduler running to withdraw the cancel request');

  try {
    // Get the current date and time
    const now = new Date();

    // Find messages with expired deliver offers (created more than 48 hours ago)
    const messageList = await prisma.orderMessage.findMany({
      where: {
        cancelProject: {
          not: null,
        },
        createdAt: {
          lt: new Date(now.getTime() - 48 * 60 * 60 * 1000), // Subtract 48 hours in milliseconds
        },
        isCancelled: false,
      },
      select: {
        projectNumber: true,
        uniqueId: true,
        cancelProject: true,
      },
    });

    if (messageList.length > 0) {
      await Promise.all(
        messageList.map(async (message) => {
          const { cancelProject, projectNumber, uniqueId } = message;

          const { isAccepted, ...rest } =
            cancelProject as unknown as cancelProjectT;

          const updateOffer = {
            isAccepted: true,
            ...rest,
          };

          if (iscancelProjectT(cancelProject)) {
            print.yellow(`Processing custom offer for message: ${uniqueId}.`);

            try {
              await prisma.orderMessage.updateMany({
                where: {
                  uniqueId: uniqueId,
                  projectNumber,
                },
                data: {
                  cancelProject: updateOffer,
                  isCancelled: true,
                },
              });

              const order = await prisma.order.update({
                where: {
                  projectNumber,
                },
                data: {
                  projectStatus: 'Canceled',
                },
              });

              if (order) {
                const userData = (await userFinder(order.userId)) as User;

                const payload = {
                  avatar: userData.image,
                  thumbnailUrl: order?.projectImage,
                  type: NotificationTypes.AutoCompleteOrder,
                  projectNumber: order.projectNumber,
                  senderUserName: userData.userName,
                  createdAt: new Date(),
                };

                await prisma.notification.upsert({
                  where: {
                    // projectNumber: order.projectNumber,
                    // recipient: 'ADMIN',
                    projectNumber_recipient: {
                      projectNumber: order.projectNumber,
                      recipient: 'ADMIN', // Or NotifyRole.USER depending on how you're passing it
                    },
                  },
                  create: {
                    recipient: 'ADMIN',
                    message: ``,
                    senderId: userData?.id as string,
                    payload: payload,
                    projectNumber: order.projectNumber,
                  },
                  update: {
                    recipient: 'ADMIN',
                    message: ``,
                    senderId: userData?.id as string,
                    payload: payload,
                    createdAt: new Date(),
                    isAdminSeen: [],
                    isClientSeen: false,
                  },
                });
                PublicMessageHandler(
                  {
                    thumbnailUrl: order?.projectImage,
                    projectNumber: projectNumber,
                    type: NotificationTypes.AutoCancelOrder,
                    createdAt: new Date(),
                    senderUserName: userData.userName,
                    avatar: userData.image,
                  },
                  'USER',
                );

                const payload2 = {
                  thumbnailUrl: order?.projectImage,
                  type: NotificationTypes.AutoCompleteOrderUser,
                  projectNumber: order.projectNumber,
                  senderUserName: 'Mahfujurrahm535',
                  createdAt: new Date(),
                  avatar: ADMINLOGO,
                };

                await prisma.notification.upsert({
                  where: {
                    // projectNumber: order.projectNumber,
                    // recipient: 'USER',
                    projectNumber_recipient: {
                      projectNumber: order.projectNumber,
                      recipient: 'USER', // Or NotifyRole.USER depending on how you're passing it
                    },
                  },
                  create: {
                    projectNumber: order.projectNumber,
                    recipient: 'USER',
                    message: ``,
                    senderId: userData?.id as string,
                    payload: payload2,
                    recipientId: order.userId,
                  },
                  update: {
                    recipient: 'USER',
                    message: ``,
                    senderId: userData?.id as string,
                    payload: payload2,
                    createdAt: new Date(),
                    isAdminSeen: [],
                    isClientSeen: false,
                  },
                });
                PublicMessageHandler(
                  {
                    thumbnailUrl: order?.projectImage,
                    projectNumber: projectNumber,
                    type: NotificationTypes.AutoCancelOrder,
                    createdAt: new Date(),
                    senderUserName: 'Mahfujurrahm535',
                    avatar: ADMINLOGO,
                  },
                  'ADMIN',
                );
              }
            } catch (err) {
              print.red(
                `Error updating customOffer for message ${uniqueId}`,
                err,
              );
            }
          }
        }),
      );
    }

    print.green(`${messageList.length} expired messages withdrawn.`);
  } catch (error) {
    print.red(`Error in scheduler: ${error}`, error);
  }
});
