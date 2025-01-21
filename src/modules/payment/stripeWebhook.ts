import { User } from '@prisma/client';

import { Request, Response } from 'express';
import httpStatus from 'http-status';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } from '../../config/config';
import { NotificationTypes } from '../../constants/Notification';
import AppError from '../../errors/AppError';
import { emailTemplate } from '../../helper/email/additionalOfferandExtendDate';
import { directProjectPlace } from '../../helper/email/directProjectPlace';
import { tipsTemplate } from '../../helper/email/tipsTemplate';
import { sendMail } from '../../helper/smtp/AWS_SES';
import { prisma } from '../../libs/prismaHelper';
import catchAsync from '../../libs/utlitys/catchSynch';
import PublicMessageHandler from '../../socket/handlers/PublicMessageHandler';
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
  const sig = req.headers['stripe-signature'];
  // const event = req.body;
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig as string,
      STRIPE_WEBHOOK_SECRET as string,
    );
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

            const { duration: Days } = rest;

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

            if (!orderData) {
              throw new Error('');
            }
            const { duration, durationHours, updatedDeliveryDate } =
              await updateDeliveryDate(orderData, parseInt(Days));

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
                deliveryDate: updatedDeliveryDate,
                totalPrice: (
                  (parseFloat(orderData?.totalPrice as string) || 0) +
                  parseInt(updateMessage.price || '0')
                ).toString(),
              },
            });

            const userData = (await userFinder(updatedOrder?.userId)) as User;

            const payload = {
              thumbnailUrl: orderData?.projectImage,
              type: NotificationTypes.AdditionalOfferAccept,
              projectNumber: orderData?.projectNumber,
              days: orderData?.duration ? updatedOrder.duration : '',
              hours: orderData?.durationHours ? updatedOrder.durationHours : '',
              senderUserName: userData?.userName,
              avatar: userData.image,
              createdAt: new Date(),
            };

            await prisma.notification.upsert({
              where: {
                projectNumber: orderData?.projectNumber,
                recipient: 'ADMIN',
              },
              create: {
                projectNumber: orderData?.projectNumber,
                recipient: 'ADMIN',
                message: ``,
                senderId: userData.id as string,
                payload: payload,
              },
              update: {
                recipient: 'ADMIN',
                message: ``,
                senderId: userData.id as string,
                payload: payload,
                createdAt: new Date(),
                isAdminSeen: [],
                isClientSeen: false,
              },
            });
            PublicMessageHandler(
              {
                thumbnailUrl: orderData?.projectImage,
                type: NotificationTypes.AdditionalOfferAccept,
                projectNumber: orderData?.projectNumber,
                days: orderData?.duration ? updatedOrder.duration : '',
                hours: orderData?.durationHours
                  ? updatedOrder.durationHours
                  : '',
                createdAt: new Date(),
                senderUserName: userData.userName,
                avatar: userData.image,
              },
              'USER',
            );

            const emailData = {
              clientName: userData.userName,
              projectNumber: orderData?.projectNumber,
              item: {
                text: updateMessage?.text,
                duration: parseInt(updateMessage?.duration),
                price: parseInt(updateMessage?.price),
              },
            };

            await sendMail({
              to: 'mahfujurr321@gmail.com',
              subject: `Good news: Your offer has been accepted`,
              html: emailTemplate(emailData),
            });
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

            await prisma.notification.upsert({
              where: {
                projectNumber: orderData.projectNumber,
                recipient: 'ADMIN',
              },
              create: {
                projectNumber: orderData.projectNumber,
                recipient: 'ADMIN',
                message: ``,
                senderId: orderData.userId as string,
                payload: payload,
              },
              update: {
                recipient: 'ADMIN',
                message: ``,
                senderId: orderData.userId as string,
                payload: payload,
                createdAt: new Date(),
                isAdminSeen: [],
                isClientSeen: false,
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
            const emailData = {
              clientName: userData.userName,
              projectNumber: orderData.projectNumber,
              totalPrice: orderData.totalPrice,
              from: orderData?.from || '',
              items: orderData.items as [],
            };

            await sendMail({
              to: 'mahfujurr321@gmail.com',
              subject: `Great news: You've received a project from ${emailData.clientName}`,
              html: directProjectPlace(emailData),
            });
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

            const existingRequest =
              await prisma.orderExtensionRequest.findUnique({
                where: { uniqueMessageId: data?.updateMessageId as string },
              });

            const orderData = await prisma.order.findUnique({
              where: { id: data?.orderId },
            });
            if (existingRequest) {
              if (orderData) {
                const userData = (await userFinder(orderData?.userId)) as User;

                PublicMessageHandler(
                  {
                    type: NotificationTypes.OrderExtend,
                    createdAt: new Date(),
                    senderUserName: userData.userName,
                    avatar: userData.image,
                    message: '',
                  },
                  'USER',
                );

                const payload = {
                  type: NotificationTypes.OrderExtend,
                  avatar: userData.image,
                  senderUserName: userData.userName,
                  message: '',
                  projectNumber: orderData.projectNumber,
                  createdAt: new Date(),
                };
                await prisma.notification.upsert({
                  where: {
                    projectNumber: orderData.projectNumber,
                    recipient: 'ADMIN',
                  },
                  create: {
                    projectNumber: orderData.projectNumber,
                    senderId: userData.id as string,
                    recipient: 'ADMIN',
                    payload: payload,
                    message: '',
                    isClientSeen: true,
                  },
                  update: {
                    senderId: userData.id as string,
                    recipient: 'ADMIN',
                    payload: payload,
                    message: '',
                    createdAt: new Date(),
                    isAdminSeen: [],
                    isClientSeen: false,
                  },
                });
              }
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
              const findMessage = await prisma.orderMessage.findMany({
                where: {
                  uniqueId: data?.updateMessageId,
                },
                take: 1,
              });

              const messageData = findMessage[0];
              const { isPending, ...rest } =
                messageData?.extendDeliveryTime as unknown as extendDeliveryTimeT;

              const updateMessage = {
                isPending: false,
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

              const userData = (await userFinder(
                orderData?.userId as string,
              )) as User;
              PublicMessageHandler(
                {
                  type: NotificationTypes.OrderExtend,
                  createdAt: new Date(),
                  senderUserName: userData.userName,
                  avatar: userData.image,
                  message: '',
                },
                'USER',
              );

              const payload = {
                type: NotificationTypes.OrderExtend,
                avatar: userData.image,
                senderUserName: userData.userName,
                message: '',
                projectNumber: orderData?.projectNumber,
                createdAt: new Date(),
              };
              await prisma.notification.upsert({
                where: {
                  projectNumber: orderData?.projectNumber,
                  recipient: 'ADMIN',
                },
                create: {
                  senderId: userData.id as string,
                  recipient: 'ADMIN',
                  payload: payload,
                  message: '',
                  isClientSeen: true,
                  projectNumber: orderData?.projectNumber as string,
                },
                update: {
                  senderId: userData.id as string,
                  recipient: 'ADMIN',
                  payload: payload,
                  message: '',
                  createdAt: new Date(),
                  isAdminSeen: [],
                  isClientSeen: false,
                },
              });
              if (data?.requestedByClient === 'false') {
                const emailData = {
                  clientName: userData.userName,
                  projectNumber: orderData?.projectNumber,
                  item: {
                    text: updateMessage?.explainWhyExtend,
                    duration: parseInt(updateMessage?.days),
                    price: updateMessage?.amount,
                    isExtend: true,
                  },
                };

                await sendMail({
                  to: 'mahfujurr321@gmail.com',
                  subject: `Good news: Your extend request has been accepted`,
                  html: emailTemplate(emailData),
                });
              }
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
                  await updateDeliveryDate(orderData, parseInt(days));
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

                const res = await prisma.notification.upsert({
                  where: {
                    projectNumber: orderData.projectNumber,
                    recipient: 'ADMIN',
                  },
                  create: {
                    recipient: 'ADMIN',
                    message: ``,
                    senderId: orderData.userId as string,
                    payload: payload,
                    projectNumber: orderData.projectNumber,
                  },
                  update: {
                    recipient: 'ADMIN',
                    message: ``,
                    senderId: orderData.userId as string,
                    payload: payload,
                    createdAt: new Date(),
                    isAdminSeen: [],
                    isClientSeen: false,
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
                    totalPrice: (
                      (parseInt(orderData?.totalPrice as string) || 0) +
                      (updateMessage.amount || 0)
                    ).toString(),
                  },
                });
              } else {
                throw new AppError(httpStatus.NOT_FOUND, 'Order not found');
              }
            }
          } else if (session?.metadata?.paymentType === PaymentType.TIPS) {
            const updateTips = { amount: data?.ammount || 0 };
            const order = await prisma.order.findUnique({
              where: {
                projectNumber: data?.projectNumber,
              },
            });
            const orderData = await prisma.order.update({
              where: {
                projectNumber: data?.projectNumber,
              },
              data: {
                projectTips: updateTips,
                totalPrice: (
                  (parseFloat(order?.totalPrice as string) || 0) +
                  parseInt(data?.ammount || '0')
                ).toString(),
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

            await prisma.notification.upsert({
              where: {
                projectNumber: orderData.projectNumber,
                recipient: 'ADMIN',
              },
              create: {
                projectNumber: orderData.projectNumber,
                recipient: 'ADMIN',
                message: ``,
                senderId: orderData.userId as string,
                payload: payload,
              },
              update: {
                recipient: 'ADMIN',
                message: ``,
                senderId: orderData.userId as string,
                payload: payload,
                createdAt: new Date(),
                isAdminSeen: [],
                isClientSeen: false,
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

            const emailData = {
              projectNumber: orderData.projectNumber,
              clientName: userData.userName,
            };

            const email = await sendMail({
              to: 'mahfujurr321@gmail.com',
              subject: `You've just been tipped!`,
              html: tipsTemplate(emailData),
            });

            console.log(email, ' email checking');

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

              const notification = await prisma.notification.upsert({
                where: {
                  projectNumber: order.projectNumber, // Ensure this field is unique in your schema
                  recipient: 'ADMIN',
                },
                create: {
                  projectNumber: order.projectNumber, // Ensure this field is unique in your schema
                  recipient: 'ADMIN',
                  message: ``,
                  senderId: data?.userId as string,
                  payload: payload,
                },
                update: {
                  recipient: 'ADMIN',
                  message: ``,
                  senderId: data?.userId as string,
                  payload: payload,
                  createdAt: new Date(),
                  isAdminSeen: [],
                  isClientSeen: false,
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
                'USER',
              );

              const emailData = {
                clientName: userData.userName,
                projectNumber: order.projectNumber,
                totalPrice: order.totalPrice,
                from: order?.from || '',
                items: order.items as [],
              };

              await sendMail({
                to: 'mahfujurr321@gmail.com',
                subject: `Great news: You've received a project from ${emailData.clientName}`,
                html: directProjectPlace(emailData),
              });
            }
          }
        }
        break;
    }
  } catch (error) {
    console.error('❌ Webhook Verification Failed', error);
  }

  res.json({ received: true });
});

export { stripeWebhook };
