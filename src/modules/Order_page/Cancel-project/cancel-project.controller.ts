import { User } from '@prisma/client';
import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '../../../config/config';
import { NotificationTypes } from '../../../constants/Notification';
import { prisma } from '../../../libs/prismaHelper';
import sendResponse from '../../../libs/sendResponse';
import catchAsync from '../../../libs/utlitys/catchSynch';
import PublicMessageHandler, {
  ADMINLOGO,
} from '../../../socket/handlers/PublicMessageHandler';
import { userFinder } from '../../../utils/userFinder';
import { ProjectStatus } from '../Order_page.constant';

interface CancelOffer {
  extendType?: string;
}

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

  const isAdminType =
    (findMessagee[0]?.cancelProject as CancelOffer).extendType ===
    'requestByMe';

  console.log(isAdminType, 'kaj korray niba');

  const payload = {
    thumbnailUrl: orderData?.projectImage,
    type: isAdminType
      ? NotificationTypes.DirectCancel
      : NotificationTypes.CancelAccept,
    projectNumber: orderData?.projectNumber,
    senderUserName: isAdminType ? 'mahfujurrahm535' : userData.userName,
    avatar: isAdminType ? ADMINLOGO : userData.image,
    createdAt: new Date(),
  };

  await prisma.notification.create({
    //
    data: {
      recipient: isAdminType ? 'USER' : 'ADMIN',
      recipientId: isAdminType ? orderData?.userId : '',
      message: ``,
      senderId: orderData?.id as string,
      isAdminSent: true,
      payload: payload,
    },
  });
  PublicMessageHandler(
    {
      thumbnailUrl: orderData?.projectImage,
      type: isAdminType
        ? NotificationTypes.DirectCancel
        : NotificationTypes.CancelAccept,
      projectNumber: orderData?.projectNumber,
      createdAt: new Date(),
      senderUserName: isAdminType ? 'mahfujurrahm535' : userData.userName,
      avatar: isAdminType ? ADMINLOGO : userData.image,
      userId: isAdminType ? orderData?.userId : '',
    },
    isAdminType ? 'ADMIN' : 'USER',
  );

  const payload2 = {
    thumbnailUrl: orderData?.projectImage,
    type: NotificationTypes.CancelAcceptUser,
    projectNumber: orderData?.projectNumber,
    senderUserName: 'mahfujurrahm535',
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
      senderUserName: 'mahfujurrahm535',
    },
    'ADMIN',
  );

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Order cancelled successfully',
  });
});
