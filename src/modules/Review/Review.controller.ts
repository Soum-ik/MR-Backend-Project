import { User, senderType } from '@prisma/client';
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { NotificationTypes } from '../../constants/Notification';
import AppError from '../../errors/AppError';
import { TokenCredential } from '../../libs/authHelper';
import { prisma } from '../../libs/prismaHelper';
import sendResponse from '../../libs/sendResponse';
import catchAsync from '../../libs/utlitys/catchSynch';
import PublicMessageHandler, {
  ADMINLOGO,
} from '../../socket/handlers/PublicMessageHandler';
import { userFinder } from '../../utils/userFinder';
import { USER_ROLE } from '../user/user.constant';

const createReview = catchAsync(async (req: Request, res: Response) => {
  const { message, rating, orderId, userName, ...rest } = req.body;
  const { role, user_id } = req.user as TokenCredential;

  const senderType = role === USER_ROLE.USER ? 'CLIENT' : 'OWNER';

  const review = await prisma.review.create({
    data: {
      message,
      rating,
      senderType,
      senderId: user_id,
      orderId: orderId,
      userName,
      ...rest,
    },
  });

  const orderData = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
  });

  const userData = (await userFinder(user_id)) as User;

  const admins = ['ADMIN', 'SUPER_ADMIN', 'SUB_ADMIN'].includes(role);

  const payload = {
    avatar: admins ? ADMINLOGO : userData?.image,
    userId: userData?.id,
    senderUserName: admins ? 'mahfujurrahm535' : userData?.userName,
    type: NotificationTypes.Review,
    rating: rating,
    createdAt: new Date(),
    projectNumber: orderData?.projectNumber,
    thumbnailUrl: orderData?.projectImage,
  };

  await prisma.notification.upsert({
    where: {
      // recipient: admins ? 'USER' : 'ADMIN',
      // projectNumber: orderData?.projectNumber,
      projectNumber_recipient: {
        projectNumber: orderData?.projectNumber as string,
        recipient: admins ? 'USER' : 'ADMIN', // Or NotifyRole.USER depending on how you're passing it
      },
    },
    update: {
      recipient: admins ? 'USER' : 'ADMIN',
      message: ``,
      senderId: user_id as string,
      payload: payload,
      recipientId: admins ? orderData?.userId : userData?.id,
      createdAt: new Date(),
      isAdminSeen: [],
      isClientSeen: false,
    },
    create: {
      recipient: admins ? 'USER' : 'ADMIN',
      message: ``,
      senderId: user_id as string,
      payload: payload,
      createdAt: new Date(),
      recipientId: admins ? orderData?.userId : userData?.id,
      projectNumber: orderData?.projectNumber as string,
    },
  });

  PublicMessageHandler(
    {
      msg: ``,
      avatar: admins ? ADMINLOGO : userData.image,
      userId: admins ? orderData?.userId : user_id,
      senderUserName: admins ? 'mahfujurrahm535' : userData.userName,
      type: NotificationTypes.Review,
      createdAt: new Date(),
      rating: rating,
      thumbnailUrl: orderData?.projectImage,
    },
    admins ? 'ADMIN' : 'USER',
  );

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Review created successfully',
    data: review,
  });
});

const getReviewsByOrderId = catchAsync(async (req: Request, res: Response) => {
  const { userName } = req.params;

  if (!userName) {
    throw new AppError(httpStatus.NOT_ACCEPTABLE, 'User Name need');
  }

  const reviews = await prisma.review.findMany({
    where: {
      senderType: 'OWNER',
      userName: userName,
    },
    include: {
      sender: {
        select: {
          role: true,
          userName: true,
          fullName: true,
          country: true,
          image: true,
        },
      },
    },
  });

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Reviews retrieved successfully',
    data: reviews,
  });
});

const getAllOwnerReviews = catchAsync(async (req: Request, res: Response) => {
  const reviews = await prisma.review.findMany({
    where: {
      senderType: 'CLIENT' as senderType,
    },
    select: {
      message: true,
      rating: true,
      createdAt: true,
      thumbnail: true,
      isThumbnail: true,
      thumbnailWatermark: true,
      senderType: true,
      sender: {
        select: {
          userName: true,
          image: true,
          fullName: true,
          country: true,
          role: true,
        },
      },
      order: {
        select: {
          projectName: true,
          projectNumber: true,
        },
      },
    },
  });
  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Owner reviews retrieved successfully',
    data: reviews,
  });
});

export const ReviewController = {
  createReview,
  getReviewsByOrderId,
  getAllOwnerReviews,
};
