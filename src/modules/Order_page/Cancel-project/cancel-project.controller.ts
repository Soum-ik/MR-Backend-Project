import { trackProjectStatus } from '@prisma/client';
import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '../../../config/config';
import { prisma } from '../../../libs/prismaHelper';
import sendResponse from '../../../libs/sendResponse';
import catchAsync from '../../../libs/utlitys/catchSynch';
import { ProjectStatus } from '../Order_page.constant';

const stripe = new Stripe(STRIPE_SECRET_KEY as string);
export const CancelProject = catchAsync(async (req: Request, res: Response) => {
  const { orderId, orderMessageId, piId } = req.body;

  // Initiate refund
  const refund = await stripe.refunds.create({
    payment_intent: piId, // Refund by piId
  });

  const findMessagee = await prisma.orderMessage.findUnique({
    where: {
      id: orderMessageId,
    },
  });

  if (!findMessagee) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Order message not found',
    });
  }

  const cancelMessage = await prisma.orderMessage.update({
    where: {
      id: orderMessageId,
    },
    data: {
      isCancelled: true,
    },
  });

  if (!cancelMessage) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Order not cancelled',
    });
  }

  await prisma.order.update({
    where: {
      id: orderId,
    },
    data: {
      projectStatus: ProjectStatus.CANCELED,
      trackProjectStatus: trackProjectStatus.CANCELLED,
      finishedDate: new Date(),
    },
  });

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Order cancelled successfully',
  });
});
