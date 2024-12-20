import { senderType } from '@prisma/client';
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import { TokenCredential } from '../../libs/authHelper';
import { prisma } from '../../libs/prismaHelper';
import sendResponse from '../../libs/sendResponse';
import catchAsync from '../../libs/utlitys/catchSynch';
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
