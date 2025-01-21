import { User } from '@prisma/client';
import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import { NotificationTypes } from '../../../constants/Notification';
import { directProjectRequirements } from '../../../helper/email/directProjectRequirements';
import { messagesTemplate } from '../../../helper/email/messagesTemplate';
import { sendMail } from '../../../helper/smtp/AWS_SES';
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
        avatar: ADMINLOGO,
        userId: userData?.id,
        thumbnailUrl: order?.projectImage,
        type: NotificationTypes.OrderStart,
        createdAt: new Date(),
        senderUserName: 'mahfujurrahm535',
        projectNumber: updateRequirements.projectNumber,
      };

      await prisma.notification.upsert({
        where: {
          projectNumber: updateRequirements.projectNumber,
          recipient: 'ADMIN',
        },
        create: {
          projectNumber: updateRequirements.projectNumber,
          recipient: 'ADMIN',
          message: ``,
          senderId: userData?.id as string,

          payload: payload,
        },
        update: {
          recipient: 'ADMIN',
          message: ``,
          senderId: userData?.id as string,
          createdAt: new Date(),
          isAdminSeen: [],
          isClientSeen: false,
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

      await prisma.notification.upsert({
        where: {
          recipient: 'USER',
          projectNumber: updateRequirements.projectNumber,
        },
        create: {
          recipient: 'USER',
          message: ``,
          senderId: userData?.id as string,
          recipientId: order.userId,
          payload: payload1,
          projectNumber: updateRequirements.projectNumber,
        },
        update: {
          recipient: 'USER',
          message: ``,
          senderId: userData?.id as string,
          recipientId: order.userId,
          payload: payload1,
          createdAt: new Date(),
          isAdminSeen: [],
          isClientSeen: false,
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

      if (role === 'USER') {
        const emailData = {
          clientName: userData.userName,
          projectNumber: updateRequirements.projectNumber,
          items: updateRequirements.items as [],
          requirements: updateRequirements.requirements as [],
          orderCreateDate: new Date(),
          totalPrice: updateRequirements.totalPrice,
          from: updateRequirements?.from || '',
        };

        const emailData2 = {
          clientName: 'Mahfujurrahm535',
          projectNumber: updateRequirements.projectNumber,
          messageText: `Your project has started! The designer is now working on your project.`,
        };

        console.log(emailData);

        await sendMail({
          to: 'sar4shakil@gmail.com',
          subject: `${emailData.clientName} added project requirements`,
          html: directProjectRequirements(emailData),
        });

        await sendMail({
          to: userData.email,
          subject: `Your Project Has been started.`,
          html: messagesTemplate(emailData2),
        });
      }
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
