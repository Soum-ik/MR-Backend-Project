import { User } from '@prisma/client';

import { Request, Response } from 'express';
import httpStatus from 'http-status';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '../../config/config';
import { NotificationTypes } from '../../constants/Notification';
import AppError from '../../errors/AppError';
import { prisma } from '../../libs/prismaHelper';
import catchAsync from '../../libs/utlitys/catchSynch';
import PublicMessageHandler from '../../socket/handlers/PublicMessageHandler';
import { daysToHours } from '../../utils/dayToHours';
import { userFinder } from '../../utils/userFinder';
import { updateDeliveryDate } from '../Order_page/ExtendDelivery/ExtendDelivary.utils';
import { OrderStatus, ProjectStatus } from '../Order_page/Order_page.constant';
import { PaymentStatus, PaymentType } from './payment.constant';
import {
  additionalOfferT,
  customOfferT,
  extendDeliveryTimeT,
} from './payment.interface';

const stripe = new Stripe(STRIPE_SECRET_KEY as string);

const stripeWebhook = catchAsync(async (req: Request, res: Response) => {
  const event = req.body;
  // console.log(event, 'checking data from custom offer after confirm ');

  // console.log('all event', event);

  // try {
  //     event = stripe.webhooks.constructEvent(
  //         req.body,
  //         sig,
  //         "whsec_1b45b1e0b2fe103a4a09e4f70e00a4d5cba39ea51a8f126b5486f03466a646c3"
  //     );
  //     console.log("iseventrunning ❗", event);
  // } catch (error: any) {
  //     console.error("Webhook signature verification failed:", error.message);
  //     return res.status(400).send(`Webhook Error: ${error.message}`);
  // }
  switch (event.type) {
    case 'checkout.session.completed':
      {
        const session = event.data.object as Stripe.Checkout.Session;
        const data = session.metadata;

        if (session?.metadata?.paymentType === PaymentType.ADDITIONAL_OFFER) {
          const findMessage = await prisma.orderMessage.findMany({
            where: {
              uniqueId: data?.updateMessageId,
            },
            take: 1,
          });
          const messageData = findMessage[0];
          const { isAccepted, ...rest } =
            messageData?.additionalOffer as unknown as additionalOfferT;

          const updateMessage = {
            isAccepted: true,
            ...rest,
          };

          await prisma.orderMessage.updateMany({
            where: {
              uniqueId: data?.updateMessageId,
            },
            data: {
              additionalOffer: updateMessage,
            },
          });

          await prisma.payment.update({
            where: { stripeId: session.id.split('_').join('') },
            data: {
              status: PaymentStatus.PAID,
              piId: session?.payment_intent as string,
            },
          });

          const orderData = await prisma.order.findUnique({
            where: {
              id: data?.orderId,
            },
          });

          const hours = daysToHours(data?.duration || '0');

          const duration =
            parseInt(orderData?.duration || '0') +
            parseInt(data?.duration || '0');
          const durationHours =
            parseInt(orderData?.durationHours || '0') + hours;

          let UpdatedDeliveryDate;

          if (orderData?.deliveryDate && orderData?.durationHours) {
            UpdatedDeliveryDate = new Date(orderData?.deliveryDate); //+
            UpdatedDeliveryDate.setHours(
              UpdatedDeliveryDate.getHours() + durationHours,
            ); //+
          } else if (orderData?.deliveryDate && orderData?.duration) {
            UpdatedDeliveryDate = new Date(orderData?.deliveryDate); //+
            UpdatedDeliveryDate.setDate(
              UpdatedDeliveryDate.getDate() + duration,
            ); //+
          }
          const updatedOrder = await prisma.order.update({
            where: {
              id: data?.orderId,
            },
            data: {
              piId: session?.payment_intent as string,
              duration: orderData?.duration ? duration.toString() : '',
              durationHours: orderData?.durationHours
                ? durationHours.toString()
                : '',
              deliveryDate: UpdatedDeliveryDate,
              totalPrice: ((parseFloat(orderData?.totalPrice as string) || 0) + parseInt(updateMessage.price || '0')).toString(),
            },
          });

          const userData = (await userFinder(updatedOrder?.userId)) as User;

          const payload = {
            thumbnailUrl: orderData?.projectImage,
            type: NotificationTypes.CustomOfferByClient,
            projectNumber: orderData?.projectNumber,
            days: orderData?.duration,
            hours: orderData?.durationHours,
            senderUserName: userData?.userName,
            avatar: userData.image,
            createdAt: new Date(),
          };

          await prisma.notification.create({
            data: {
              recipient: 'ADMIN',
              message: ``,
              senderId: userData.id as string,
              payload: payload,
            },
          });
          PublicMessageHandler(
            {
              thumbnailUrl: orderData?.projectImage,
              type: NotificationTypes.AdditionalOfferAccept,
              projectNumber: orderData?.projectNumber,
              days: orderData?.duration,
              hours: orderData?.durationHours,
              createdAt: new Date(),
              senderUserName: userData.userName,
              avatar: userData.image,
            },
            'USER',
          );
        } else if (
          session?.metadata?.paymentType === PaymentType.CUSTOM_OFFER
        ) {
          const findMessage = await prisma.message.findMany({
            where: {
              uniqueId: data?.updateMessageId,
            },
            take: 1,
          });
          const messageData = findMessage[0];
          const { isAccepted, ...rest } =
            messageData?.customOffer as unknown as customOfferT;
          const updateMessage = {
            isAccepted: true,
            ...rest,
          };
          await prisma.message.updateMany({
            where: {
              uniqueId: data?.updateMessageId,
            },
            data: {
              customOffer: updateMessage,
            },
          });


          await prisma.payment.update({
            where: { stripeId: session.id.split('_').join('') },
            data: {
              status: PaymentStatus.PAID,
              piId: session?.payment_intent as string,
            },
          });
          const orderData = await prisma.order.update({
            where: { stripeId: session.id.split('_').join('') },
            data: {
              trackProjectStatus: OrderStatus.PROJECT_PLACED,
              projectStatus: ProjectStatus.WAITING,
              paymentStatus: PaymentStatus.PAID,
              piId: session?.payment_intent as string,
            },
          });
          const userData = (await userFinder(orderData.userId)) as User;

          const payload = {
            thumbnailUrl: orderData?.projectImage,
            type: NotificationTypes.CustomOfferByClient,
            projectNumber: orderData.projectNumber,
            days: orderData.duration,
            hours: orderData.durationHours,
            senderUserName: userData.userName,
            avatar: userData.image,
            createdAt: new Date(),
          };

          await prisma.notification.create({
            data: {
              recipient: 'ADMIN',
              message: ``,
              senderId: orderData.userId as string,
              payload: payload,
            },
          });
          PublicMessageHandler(
            {
              thumbnailUrl: orderData?.projectImage,
              type: NotificationTypes.CustomOfferByClient,
              projectNumber: orderData.projectNumber,
              days: orderData.duration,
              hours: orderData.durationHours,
              createdAt: new Date(),
              senderUserName: userData.userName,
              avatar: userData.image,
            },
            'USER',
          );
        } else if (
          session?.metadata?.paymentType === PaymentType.EXTEND_DELIVERY
        ) {
          const paymentStats = await prisma.payment.update({
            where: { stripeId: session.id.split('_').join('') },
            data: {
              status: PaymentStatus.PAID,
              piId: session?.payment_intent as string,
            },
          });

          const existingRequest = await prisma.orderExtensionRequest.findUnique(
            {
              where: { uniqueMessageId: data?.updateMessageId as string },
            },
          );

          if (existingRequest) {
            return console.log('Request are already taken');
          }

          try {
            const request = await prisma.orderExtensionRequest.create({
              data: {
                piId: session?.payment_intent as string,
                uniqueMessageId: data?.updateMessageId as string,
                orderId: data?.orderId as string,
                requestedByClient:
                  data?.requestedByClient === 'false' ? false : true,
                requestJSON: data,
                paymentStatus: paymentStats.status,
              },
            });
          } catch (error) {
            // console.log('Error in extend delivery', error);
          }

          if (data?.requestedByClient === 'false') {
            const findMessage = await prisma.orderMessage.findMany({
              where: {
                uniqueId: data?.updateMessageId,
              },
              take: 1,
            });

            const messageData = findMessage[0];
            const { isAccepted, ...rest } =
              messageData?.extendDeliveryTime as unknown as extendDeliveryTimeT;

            const { days } = rest;

            const orderData = await prisma.order.findUnique({
              where: { id: data?.orderId },
            });

            if (orderData) {
              const { duration, durationHours, updatedDeliveryDate } =
                await updateDeliveryDate(orderData, days);
              const updateMessage = {
                isAccepted: true,
                ...rest,
              };

              await prisma.orderMessage.updateMany({
                where: {
                  uniqueId: data?.updateMessageId,
                },
                data: {
                  extendDeliveryTime: updateMessage,
                },
              });

              const userData = (await userFinder(orderData.userId)) as User;

              const payload = {
                thumbnailUrl: orderData?.projectImage,
                type: NotificationTypes.OrderExtendUser,
                projectNumber: orderData.projectNumber,
                days: orderData.duration,
                hours: orderData.durationHours,
                senderUserName: userData.userName,
                avatar: userData.image,
                createdAt: new Date(),
              };

              await prisma.notification.create({
                data: {
                  recipient: 'ADMIN',
                  message: ``,
                  senderId: orderData.userId as string,
                  payload: payload,
                },
              });
              PublicMessageHandler(
                {
                  thumbnailUrl: orderData?.projectImage,
                  type: NotificationTypes.OrderExtendUser,
                  projectNumber: orderData.projectNumber,
                  days: orderData.duration,
                  hours: orderData.durationHours,
                  createdAt: new Date(),
                  senderUserName: userData.userName,
                  avatar: userData.image,
                },
                'USER',
              );

              await prisma.order.update({
                where: { id: data?.orderId },
                data: {
                  duration: orderData.duration ? duration.toString() : '',
                  durationHours: orderData.durationHours
                    ? durationHours.toString()
                    : '',
                  deliveryDate: updatedDeliveryDate,
                  totalPrice: (parseInt(orderData?.totalPrice as string) || 0) + (updateMessage.amount || 0).toString(),
                },
              });
            } else {
              throw new AppError(httpStatus.NOT_FOUND, 'Order not found');
            }
          }
        } else if (session?.metadata?.paymentType === PaymentType.TIPS) {

          const updateTips = { amount: data?.ammount || 0 };
          const orderData = await prisma.order.update({
            where: {
              projectNumber: data?.projectNumber,
            },
            data: {
              projectTips: updateTips,
            },
          });

          const userData = (await userFinder(orderData.userId)) as User;

          const payload = {
            thumbnailUrl: orderData?.projectImage,
            type: NotificationTypes.Tips,
            projectNumber: orderData.projectNumber,
            days: orderData.duration,
            hours: orderData.durationHours,
            senderUserName: userData.userName,
            avatar: userData.image,
            createdAt: new Date(),

          };

          await prisma.notification.create({
            data: {
              recipient: 'ADMIN',
              message: ``,
              senderId: orderData.userId as string,
              payload: payload,
            },
          });
          PublicMessageHandler(
            {
              thumbnailUrl: orderData?.projectImage,
              type: NotificationTypes.Tips,
              projectNumber: orderData.projectNumber,
              days: orderData.duration,
              hours: orderData.durationHours,
              createdAt: new Date(),
              senderUserName: userData.userName,
              avatar: userData.image,
            },
            'USER',
          );

          await prisma.payment.update({
            where: { stripeId: session.id.split('_').join('') },
            data: {
              status: PaymentStatus.PAID,
              piId: session?.payment_intent as string,
            },
          });
        } else {
          // Save payment info in the database
          await prisma.payment.update({
            where: { stripeId: session.id.split('_').join('') },
            data: {
              status: PaymentStatus.PAID,
              piId: session?.payment_intent as string,
            },
          });

          // Create an order linked to the payment and user
          const order = await prisma.order.update({
            where: { stripeId: session.id.split('_').join('') },
            data: {
              trackProjectStatus: OrderStatus.PROJECT_PLACED,
              projectStatus: ProjectStatus.WAITING,
              paymentStatus: PaymentStatus.PAID,
              piId: session?.payment_intent as string,
            },
          });

          if (data?.userId) {
            const userData = (await userFinder(data?.userId)) as User;

            const payload = {
              avatar: userData?.image,
              userId: userData?.id,
              senderUserName: userData?.userName,
              thumbnailUrl: order?.projectImage,
              projectNumber: order.projectNumber,
              type: NotificationTypes.Order,
              createdAt: new Date(),
            };

            await prisma.notification.create({
              data: {
                recipient: 'ADMIN',
                message: ``,
                senderId: data?.userId as string,
                payload: payload,
              },
            });
            PublicMessageHandler(
              {
                msg: ``,
                avatar: userData.image,
                userId: userData.id,
                senderUserName: userData.userName,
                thumbnailUrl: order.projectImage,
                projectNumber: order.projectNumber,
                type: NotificationTypes.Order,
                createdAt: new Date(),
              },
              "USER",
            );
          }
        }
      }
      break;
  }

  res.json({ received: true });
});

export { stripeWebhook };
