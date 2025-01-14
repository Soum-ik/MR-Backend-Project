import { ProjectStatus, User } from '@prisma/client';
import schedule from 'node-schedule';
import { NotificationTypes } from '../constants/Notification';
import { print } from '../helper/colorConsolePrint.ts/colorizedConsole';
import { prisma } from '../libs/prismaHelper';
import { OrderStatus } from '../modules/Order_page/Order_page.constant';
import { deliverProjectT } from '../modules/payment/payment.interface';
import PublicMessageHandler from '../socket/handlers/PublicMessageHandler';
import { userFinder } from '../utils/userFinder';

function isDeliverProjectT(offer: unknown): offer is deliverProjectT {
  if (typeof offer !== 'object' || offer === null) return false;

  const maybeOffer = offer as Partial<deliverProjectT>;

  return (
    maybeOffer.isRevision === false &&
    maybeOffer.isAccepted === false &&
    typeof maybeOffer.thumbnailImage === 'object' &&
    Array.isArray(maybeOffer.attachments) &&
    maybeOffer.attachments.every((item) => typeof item === 'object')
  );
}

schedule.scheduleJob('*/10  * * * * *', async () => {
  print.blue('Scheduler running to withdraw the delivery project');

  try {
    // Get the current date and time
    const now = new Date();

    // Find messages with expired deliver offers (created more than 48 hours ago)
    const messageList = await prisma.orderMessage.findMany({
      where: {
        deliverProject: {
          not: null,
        },
        createdAt: {
          lt: new Date(now.getTime() - 48 * 60 * 60 * 1000), // Subtract 48 hours in milliseconds
        },
      },
      select: {
        projectNumber: true,
        uniqueId: true,
        deliverProject: true,
      },
    });

    if (messageList.length > 0) {
      await Promise.all(
        messageList.map(async (message) => {
          const { deliverProject, projectNumber, uniqueId } = message;

          const { isAccepted, ...rest } =
            deliverProject as unknown as deliverProjectT;

          const updateOffer = {
            isAccepted: true,
            ...rest,
          };

          if (isDeliverProjectT(deliverProject)) {
            print.yellow(`Processing custom offer for message: ${uniqueId}.`);

            try {
              await prisma.orderMessage.updateMany({
                where: {
                  uniqueId: uniqueId,
                  projectNumber,
                },
                data: {
                  deliverProject: updateOffer,
                },
              });

              const order = await prisma.order.update({
                where: {
                  projectNumber,
                },
                data: {
                  adminDeliveryRequest: true,
                  clientApproval: true,
                  projectStatus: ProjectStatus.Completed,
                  trackProjectStatus: OrderStatus.COMPLETE_PROJECT,
                  submittedData: updateOffer,
                  deliveryAttempt: 2,
                  projectThumbnail: updateOffer?.thumbnailImage
                    ?.watermark as unknown as string,
                  completedDate: new Date(),
                  user: {
                    update: {
                      totalOrder: {
                        increment: 1
                      }
                    }
                  }
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

                await prisma.notification.create({
                  data: {
                    recipient: 'ADMIN',
                    message: ``,
                    senderId: userData?.id as string,
                    payload: payload,
                  },
                });
                PublicMessageHandler(
                  {
                    thumbnailUrl: order?.projectImage,
                    projectNumber: projectNumber,
                    type: NotificationTypes.CompleteOrder,
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
                  senderUserName: 'mahfujurrahm535',
                  createdAt: new Date(),
                  avatar: '',
                };

                await prisma.notification.create({
                  data: {
                    recipient: 'USER',
                    message: ``,
                    senderId: userData?.id as string,
                    payload: payload2,
                  },
                });
                PublicMessageHandler(
                  {
                    thumbnailUrl: order?.projectImage,
                    projectNumber: projectNumber,
                    type: NotificationTypes.CompleteOrderUser,
                    createdAt: new Date(),
                    senderUserName: 'mahfujurrahm535',
                    avatar: '',
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
