import { PaymentStatus } from '@prisma/client';
import { Request } from 'express';
import httpStatus from 'http-status';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '../../config/config';
import { prisma } from '../../libs/prismaHelper';
import sendResponse from '../../libs/sendResponse';
import catchAsync from '../../libs/utlitys/catchSynch';

const stripe = new Stripe(STRIPE_SECRET_KEY as string);

const ExtendDelivery = catchAsync(async (req: Request, res: any) => {
  const { data } = req.body;

  const offer = data?.updatedMessage


  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: data?.totalAmount * 100 || 0,
          product_data: {
            name: data?.paymentType,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      paymentType: data.paymentType,
      updateMessageId: offer?.uniqueId || null,
      duration: data?.duration,
      orderId: data?.orderId,
      requestedByClient: data?.requestedByClient,  // as boolean
      offer
    },
    success_url: `http://localhost:5173/order/${data?.projectNumber}`,
    cancel_url: 'http://localhost:5173/payment-failed',
  });

  //   this is the payment controller it will handle all kind offer
  await prisma.payment.create({
    data: {
      userId: data?.userId,
      stripeId: session.id.split('_').join(''),
      status: PaymentStatus.PENDING,
      amount: data?.totalAmount.toString(),
      currency: session.currency as string,
      orderId: data?.orderId,
      PaymentType: data?.paymentType,
    },
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order successfully created with status 'PENDING'",
    data: { id: session.id },
  });
});

export { ExtendDelivery };
