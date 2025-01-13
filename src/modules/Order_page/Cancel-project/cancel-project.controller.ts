import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '../../../config/config';
import { prisma } from '../../../libs/prismaHelper';
import sendResponse from '../../../libs/sendResponse';
import catchAsync from '../../../libs/utlitys/catchSynch';
import { ProjectStatus } from '../Order_page.constant';
import PublicMessageHandler from '../../../socket/handlers/PublicMessageHandler';
import { userFinder } from '../../../utils/userFinder';
import { User } from '@prisma/client';
import { NotificationTypes } from '../../../constants/Notification';

const stripe = new Stripe(STRIPE_SECRET_KEY as string);
export const CancelProject = catchAsync(async (req: Request, res: Response) => {
  const { orderId, orderMessageId, piId } = req.body;

  // Initiate refund
  const refund = await stripe.refunds.create({
    payment_intent: piId, // Refund by piId
  });

  const findMessagee = await prisma.orderMessage.findMany({
    where: {
      uniqueId: orderMessageId,
    },
    take: 1,
  });

  if (!findMessagee) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Order message not found',
    });
  }

  const cancelMessage = await prisma.orderMessage.updateMany({
    where: {
      uniqueId: orderMessageId,
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

  const orderData = await prisma.order.update({
    where: {
      id: orderId,
    },
    data: {
      projectStatus: ProjectStatus.CANCELED,
      cancelledDate: new Date(),
    },
  });

  const userData = (await userFinder(orderData?.userId as string)) as User;

  const payload = {
    thumbnailUrl: orderData?.projectImage,
    type: NotificationTypes.CancelAccept,
    projectNumber: orderData?.projectNumber,
    senderUserName: userData.userName,
    avatar: userData.image,
    createdAt: new Date(),
  };

  await prisma.notification.create({
    //
    data: {
      recipient: 'ADMIN',
      message: ``,
      senderId: orderData?.id as string,
      isAdminSent: true,
      payload: payload,
    },
  });
  PublicMessageHandler(
    {
      thumbnailUrl: orderData?.projectImage,
      type: NotificationTypes.CancelAccept,
      projectNumber: orderData?.projectNumber,
      createdAt: new Date(),
      senderUserName: userData.userName,
      avatar: userData.image,
    },
    'USER',
  );

  const payload2 = {
    thumbnailUrl: orderData?.projectImage,
    type: NotificationTypes.CancelAcceptUser,
    projectNumber: orderData?.projectNumber,
    senderUserName: "mahfujurrahm535",
    createdAt: new Date(),
  };

  await prisma.notification.create({
    //
    data: {
      recipient: 'USER',
      message: ``,
      senderId: orderData?.id as string,
      isAdminSent: true,
      payload: payload2,
    },
  });
  PublicMessageHandler(
    {
      thumbnailUrl: orderData?.projectImage,
      type: NotificationTypes.CancelAcceptUser,
      projectNumber: orderData?.projectNumber,
      createdAt: new Date(),
      senderUserName: "mahfujurrahm535",
    },
    'ADMIN',
  );


  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Order cancelled successfully',
  });
});
