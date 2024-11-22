import { PaymentStatus } from '@prisma/client';
import { ObjectId } from 'bson';
import { Request } from 'express';
import httpStatus from 'http-status';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '../../config/config';
import AppError from '../../errors/AppError';
import { prisma } from '../../libs/prismaHelper';
import sendResponse from '../../libs/sendResponse';
import catchAsync from '../../libs/utlitys/catchSynch';

const stripe = new Stripe(STRIPE_SECRET_KEY as string);

const additionalPayment = catchAsync(async (req: Request, res: any) => {
  const { data } = req.body;
  console.log(req.body, 'req.body');

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: data?.amount * 100 || 0,
          product_data: {
            name: data?.paymentType,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      paymentType: data?.paymentType,
    },
    success_url: `http://localhost:5173/order/${data?.projectNumber}`,
    cancel_url: 'http://localhost:5173/payment-failed',
  });

  const payment = await prisma.payment.create({
    data: {
      userId: data?.userId,
      stripeId: session.id.split('_').join(''),
      status: PaymentStatus.PENDING,
      amount: data?.totalAmount.toString(),
      currency: session.currency as string,
      orderId: new ObjectId().toString(),
      PaymentType : data.paymentType
    },
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order successfully created with status 'PENDING'",
    data: { id: session.id },
  });
});

export const stripePayment = { additionalPayment };
