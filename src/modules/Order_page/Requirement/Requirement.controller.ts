import { User } from '@prisma/client';
import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import { NotificationTypes } from '../../../constants/Notification';
import { TokenCredential } from '../../../libs/authHelper';
import { prisma } from '../../../libs/prismaHelper';
import sendResponse from '../../../libs/sendResponse';
import catchAsync from '../../../libs/utlitys/catchSynch';
import PublicMessageHandler, {
  ADMINLOGO,
} from '../../../socket/handlers/PublicMessageHandler';
import { userFinder } from '../../../utils/userFinder';
import { OrderStatus, ProjectStatus } from '../Order_page.constant';

const calculateDeliveryDate = (
  duration: string | null,
  durationHours: string | null,
): Date => {
  const deliveryDate = new Date();
  if (duration) {
    deliveryDate.setDate(deliveryDate.getDate() + parseInt(duration));
  }
  if (durationHours) {
    deliveryDate.setHours(deliveryDate.getHours() + parseInt(durationHours));
  }
  return deliveryDate;
};

const answerRequirements = catchAsync(async (req: Request, res: Response) => {
  const { user_id, role } = req.user as TokenCredential;
  const { orderId, requirements, isRequirementsFullFilled } = req.body;
  // Check if order exists
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    return sendResponse<any>(res, {
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      success: false,
      message: 'Order id are not found',
    });
  }
  const updateRequirements = await prisma.order.update({
    where: {
      id: orderId,
    },
    data: {
      requirements: requirements,
      isRequirementsFullFilled: isRequirementsFullFilled,
    },
  });
  if (updateRequirements.isRequirementsFullFilled) {
    const { duration, durationHours } = updateRequirements;
    await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        trackProjectStatus: OrderStatus.REQUIREMENTS_SUBMITTED,
        projectStatus: ProjectStatus.ONGOING,
        startDate: new Date(),
        deliveryDate:
          duration || durationHours
            ? calculateDeliveryDate(duration, durationHours)
            : new Date(),
      },
    });

    if (user_id) {
      let userData;
      if (role === 'USER') {
        userData = (await userFinder(user_id)) as User;
      } else {
        userData = (await userFinder(order?.userId)) as User;
      }

      const payload = {
        avatar: userData?.image,
        userId: userData?.id,
        senderUserName: userData?.userName,
        thumbnailUrl: order?.projectImage,
        type: NotificationTypes.Instructions,
        createdAt: new Date(),
        projectNumber: updateRequirements.projectNumber,
      };
      const payload1 = {
        avatar: userData?.image,
        userId: userData?.id,
        thumbnailUrl: order?.projectImage,
        type: NotificationTypes.OrderStart,
        createdAt: new Date(),
        senderUserName: 'mahfujurrahm535',
        projectNumber: updateRequirements.projectNumber,
      };

      await prisma.notification.create({
        data: {
          recipient: 'ADMIN',
          message: ``,
          senderId: userData?.id as string,

          payload: payload,
        },
      });
      PublicMessageHandler(
        {
          msg: ``,
          avatar: userData?.image,
          userId: userData?.id,
          senderUserName: userData?.userName,
          thumbnailUrl: order.projectImage,
          type: NotificationTypes.Instructions,
          projectNumber: updateRequirements.projectNumber,
          createdAt: new Date(),
        },
        'USER',
      );

      await prisma.notification.create({
        data: {
          recipient: 'USER',
          message: ``,
          senderId: userData?.id as string,
          recipientId: order.userId,
          payload: payload1,
        },
      });
      PublicMessageHandler(
        {
          msg: ``,
          avatar: ADMINLOGO,
          userId: order.userId,
          senderUserName: 'mahfujurrahm535',
          thumbnailUrl: order.projectImage,
          type: NotificationTypes.OrderStart,
          projectNumber: updateRequirements.projectNumber,
          createdAt: new Date(),
        },
        'ADMIN',
      );
    }

    return sendResponse<any>(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: 'Requirement placed successfully saved & project start',
    });
  }
  return sendResponse<any>(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Requirement not placed successfully saved',
  });
});

export const requirementAnswer = {
  answerRequirements,
};
