
import { unreadMessageController } from './../chat/unread/unread-message.controller';
import { Request, Response } from 'express';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '../../config/config';
import { prisma } from '../../libs/prismaHelper';
import { OrderStatus, ProjectStatus } from '../Order_page/Order_page.constant';
import { PaymentStatus, PaymentType } from './payment.constant';
import { daysToHours } from '../../utils/dayToHours';
import catchAsync from '../../libs/utlitys/catchSynch';
import { additionalOfferT, customOfferT, extendDeliveryTimeT } from './payment.interface';

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
        const data = session.metadata


        if (session?.metadata?.paymentType === PaymentType.ADDITIONAL_OFFER) {
          const findMessage = await prisma.orderMessage.findMany({
            where: {
              uniqueId: data?.updateMessageId
            },
            take: 1
          })
          const messageData = findMessage[0]
          const { isAccepted, ...rest } = messageData?.additionalOffer as unknown as additionalOfferT

          const updateMessage = {
            isAccepted: true,
            ...rest,
          }

          await prisma.orderMessage.updateMany({
            where: {
              uniqueId: data?.updateMessageId
            }, data: {
              additionalOffer: updateMessage
            }
          })

          await prisma.payment.update({
            where: { stripeId: session.id.split('_').join('') },
            data: {
              status: PaymentStatus.PAID,
              piId: session?.payment_intent as string,
            },
          });

          const orderData = await prisma.order.findUnique({
            where: {
              id: data?.orderId
            },
          })


          console.log(orderData, 'order data checking');


          const hours = daysToHours(data?.duration || '0')

          const duration = parseInt(orderData?.duration || '0') + parseInt(data?.duration || '0')
          const durationHours = parseInt(orderData?.durationHours || '0') + hours

          console.log(durationHours, 'durationHours checking ');


          let UpdatedDeliveryDate;

          if (orderData?.deliveryDate && orderData?.durationHours) {
            UpdatedDeliveryDate = new Date(orderData?.deliveryDate);//+
            UpdatedDeliveryDate.setHours(UpdatedDeliveryDate.getHours() + durationHours);//+ 
          } else if (orderData?.deliveryDate && orderData?.duration) {
            UpdatedDeliveryDate = new Date(orderData?.deliveryDate);//+
            UpdatedDeliveryDate.setDate(UpdatedDeliveryDate.getDate() + duration);//+
          }


          await prisma.order.update({
            where: {
              id: data?.orderId
            },
            data: {
              piId: session?.payment_intent as string,
              duration: orderData?.duration ? duration.toString() : '',
              durationHours: orderData?.durationHours ? durationHours.toString() : '',
              deliveryDate: UpdatedDeliveryDate
            },
          });

        } else if (session?.metadata?.paymentType === PaymentType.CUSTOM_OFFER) {
          const findMessage = await prisma.message.findMany({
            where: {
              uniqueId: data?.updateMessageId
            },
            take: 1
          })
          const messageData = findMessage[0]
          const { isAccepted, ...rest } = messageData?.customOffer as unknown as customOfferT
          const updateMessage = {
            isAccepted: true,
            ...rest,
          }
          await prisma.message.updateMany({
            where: {
              uniqueId: data?.updateMessageId
            }, data: {
              customOffer: updateMessage
            }
          })

          await prisma.payment.update({
            where: { stripeId: session.id.split('_').join('') },
            data: {
              status: PaymentStatus.PAID,
              piId: session?.payment_intent as string,
            },
          });
          await prisma.order.update({
            where: { stripeId: session.id.split('_').join('') },
            data: {
              trackProjectStatus: OrderStatus.PROJECT_PLACED,
              projectStatus: ProjectStatus.WAITING,
              paymentStatus: PaymentStatus.PAID,
              piId: session?.payment_intent as string,
            },
          });

        } else if (session?.metadata?.paymentType === PaymentType.EXTEND_DELIVERY) {
          const findMessage = await prisma.orderMessage.findMany({
            where: {
              uniqueId: data?.updateMessageId
            },
            take: 1
          })
          const messageData = findMessage[0]
          const { isAccepted, ...rest } = messageData?.extendDeliveryTime as unknown as extendDeliveryTimeT

          const { days } = rest

          const orderData = await prisma.order.findUnique({
            where: {
              id: data?.orderId
            },
          })
          const hours = daysToHours(data?.days || '0')

          const duration = parseInt(orderData?.duration || '0') + days
          const durationHours = parseInt(orderData?.durationHours || '0') + hours

          let UpdatedDeliveryDate;
          if (orderData?.deliveryDate && orderData?.durationHours) {
            UpdatedDeliveryDate = new Date(orderData?.deliveryDate);//+
            UpdatedDeliveryDate.setDate(UpdatedDeliveryDate.getDate() + duration);//+ 
          } else if (orderData?.deliveryDate && orderData?.duration) {
            UpdatedDeliveryDate = new Date(orderData?.deliveryDate);//+
            UpdatedDeliveryDate.setDate(UpdatedDeliveryDate.getDate() + duration);//+
          }


          const updateMessage = {
            isAccepted: true,
            ...rest,
          }

          await prisma.orderMessage.updateMany({
            where: {
              uniqueId: data?.updateMessageId
            }, data: {
              extendDeliveryTime: updateMessage
            }
          })

          await prisma.order.update({
            where: {
              id: data?.orderId
            },
            data: {
              duration: orderData?.duration ? duration.toString() : '',
              durationHours: orderData?.durationHours ? durationHours.toString() : '',
              deliveryDate: UpdatedDeliveryDate
            },

          })

          await prisma.payment.update({
            where: { stripeId: session.id.split('_').join('') },
            data: {
              status: PaymentStatus.PAID,
              piId: session?.payment_intent as string,
            },
          });

        } else if (session?.metadata?.paymentType === PaymentType.TIPS) {
          // paymentType: data.paymentType,
          // ammount: data?.totalAmount,
          // projectNumber: data?.projectNumber,

          const updateTips = { amount: data?.ammount || 0 }
          await prisma.order.update({
            where: {
              projectNumber: data?.projectNumber
            },
            data: {
              projectTips: updateTips
            }
          })

          await prisma.payment.update({
            where: { stripeId: session.id.split('_').join('') },
            data: {
              status: PaymentStatus.PAID,
              piId: session?.payment_intent as string,
            },
          });

          console.log('Tips payment successfully updated in the database.');



        }
        else {
          // Save payment info in the database
          await prisma.payment.update({
            where: { stripeId: session.id.split('_').join('') },
            data: {
              status: PaymentStatus.PAID,
              piId: session?.payment_intent as string,
            },
          });

          console.log('Payment successfully updated in the database.');

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


          console.log('order', order);
          console.log("Order successfully updated with status 'PLACED'.");

        }
      }
      break;
  }

  res.json({ received: true });
});

export { stripeWebhook };
