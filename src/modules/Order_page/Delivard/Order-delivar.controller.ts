import { User } from '@prisma/client';
import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import { NotificationTypes } from '../../../constants/Notification';
import { TokenCredential } from '../../../libs/authHelper';
import { prisma } from '../../../libs/prismaHelper';
import sendResponse from '../../../libs/sendResponse';
import catchAsync from '../../../libs/utlitys/catchSynch';
import PublicMessageHandler from '../../../socket/handlers/PublicMessageHandler';
import { userFinder } from '../../../utils/userFinder';
import { OrderStatus, ProjectStatus } from '../Order_page.constant';

interface deliverProjectT {
  isRevision: boolean;
  isAccepted: boolean;
  thumbnailImage: object;
  attachments: Array<object>;
}

const DeliveredOrders = catchAsync(async (req: Request, res: Response) => {
  const { projectNumber, uniqueId, updatedMessage, userId } = req.body;
  const { user_id } = req.user as TokenCredential;
  const result = await prisma.$transaction(async (prisma) => {
    const order = await prisma.order.findUnique({
      where: {
        projectNumber,
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }
    const extension =
      '.' +
      updatedMessage?.deliverProject?.thumbnailImage?.name?.split('.').pop();

    // Remove the last occurrence of the extension
    const nameWithoutExtName =
      updatedMessage?.deliverProject?.thumbnailImage?.name?.replace(
        new RegExp(`${extension}$`),
        '',
      );
    // Update order with delivery request
    const updateOrder = await prisma.order.update({
      where: {
        projectNumber,
      },
      data: {
        adminDeliveryRequest: true,
        clientApproval: true,
        projectStatus: ProjectStatus.COMPLETED,
        trackProjectStatus: OrderStatus.COMPLETE_PROJECT,
        submittedData: updatedMessage,
        deliveryAttempt: 2,
        completedProjectName: nameWithoutExtName,
        projectThumbnail:
          updatedMessage?.deliverProject?.thumbnailImage?.watermark,
        completedDate: new Date(),
        user: {
          update: {
            totalOrder: {
              increment: 1,
            },
          },
        },
      },
    });

    // Emit a socket event for notifications
    // io.to(user_id).emit("send:notification", notifications);
    const { isAccepted, ...other } =
      updatedMessage?.deliverProject as unknown as deliverProjectT;

    // Update order with delivered data
    const updateMessage = {
      isAccepted: true,
      ...other,
    };

    // Update all messages with the same uniqueId
    await prisma.orderMessage.updateMany({
      where: {
        uniqueId: uniqueId,
      },
      data: {
        deliverProject: updateMessage,
      },
    });

    // update the affiliates program
    const affiliatesprogram = await prisma.affiliateJoin.findFirst({
      where: {
        userId: userId,
      },
      include: {
        affiliate: {
          select: {
            userId: true,
            amount: true,
          },
        },
      },
    });

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        userName: true,
        affiliateId: true,
        isFirstOrderComplete: true,
      },
    });

    if (!user?.isFirstOrderComplete && user?.affiliateId) {
      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          isFirstOrderComplete: true,
        },
        select: {
          id: true,
          userName: true,
          affiliateId: true,
          isFirstOrderComplete: true,
        },
      });

      await prisma.user.update({
        where: {
          id: affiliatesprogram?.affiliate.userId as string,
        },
        data: {
          totalEaring: {
            increment: 5,
          },
        },
      });
    }
    const userData = (await userFinder(user_id)) as User;

    const payload = {
      thumbnailUrl: order?.projectImage,
      type: NotificationTypes.CompleteOrder,
      projectNumber: order.projectNumber,
      senderUserName: userData.userName,
      avatar: userData.image,
      createdAt: new Date(),
    };

    await prisma.notification.create({
      //
      data: {
        recipient: 'ADMIN',
        message: ``,
        senderId: userData?.id as string,
        payload: payload,
      },
    });
    PublicMessageHandler(
      {
        thumbnailUrl: order?.projectImage,
        projectNumber: projectNumber,
        type: NotificationTypes.CompleteOrder,
        createdAt: new Date(),
        senderUserName: userData.userName,
        avatar: userData.image,
      },
      'USER',
    );

    const payload2 = {
      thumbnailUrl: order?.projectImage,
      type: NotificationTypes.CompleteOrderUser,
      projectNumber: order.projectNumber,
      senderUserName: 'mahfujurrahm535',
      createdAt: new Date(),
    };

    await prisma.notification.create({
      //
      data: {
        recipient: 'USER',
        message: ``,
        senderId: userData?.id as string,
        payload: payload2,
      },
    });
    PublicMessageHandler(
      {
        thumbnailUrl: order?.projectImage,
        projectNumber: projectNumber,
        type: NotificationTypes.CompleteOrderUser,
        createdAt: new Date(),
        senderUserName: 'mahfujurrahm535',
      },
      'ADMIN',
    );

    return updateOrder;
  });

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    data: result,
    message: 'Delivery accepted successfully',
  });
});

const handleDeliveryResponse = catchAsync(
  async (req: Request, res: Response) => {
    const { projectNumber, uniqueId, updatedMessage } = req.body;
    const { user_id } = req.user as TokenCredential;
    const result = await prisma.$transaction(async (prisma) => {
      const order = await prisma.order.findUnique({
        where: {
          projectNumber,
        },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      // Update order with delivery request
      await prisma.order.update({
        where: {
          projectNumber,
        },
        data: {
          adminDeliveryRequest: true,
          projectStatus: ProjectStatus.REVISION,
          trackProjectStatus: OrderStatus.REVIEW_DELIVERY,
          submittedData: updatedMessage,
          deliveryAttempt: 1,
        },
      });

      const { isRevision, ...other } =
        updatedMessage?.deliverProject as unknown as deliverProjectT;

      // Update order with delivered data
      const updateMessage = {
        isRevision: true,
        ...other,
      };

      const userData = (await userFinder(user_id)) as User;

      const payload = {
        thumbnailUrl: order?.projectImage,
        type: NotificationTypes.Revision,
        projectNumber: order.projectNumber,
        projectName: order.projectName,
        senderUserName: userData.userName,
        avatar: userData.image,
        createdAt: new Date(),
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
          deliveryDate: order.deliveryDate,
          projectName: order.projectName,
          projectNumber: projectNumber,
          senderUserName: userData.userName,
          avatar: userData.image,
          type: NotificationTypes.Revision,
          thumbnailUrl: order?.projectImage,
          createdAt: new Date(),
        },
        'USER',
      );

      // Update all messages with the same uniqueId
      await prisma.orderMessage.updateMany({
        where: {
          uniqueId: uniqueId,
        },
        data: {
          deliverProject: updateMessage,
        },
      });

      return order;
    });

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      data: result,
      message: 'Revision accepted successfully',
    });
  },
);

const OrderDelivardStatus = catchAsync(async (req: Request, res: Response) => {
  const { projectNumber } = req.body;

  const order = await prisma.order.update({
    where: {
      projectNumber,
    },
    data: {
      projectStatus: 'Delivered',
    },
  });

  // const userData = (await userFinder(order.userId)) as User;

  const payload = {
    thumbnailUrl: order?.projectImage,
    type: NotificationTypes.FileDelivered,
    projectNumber: order.projectNumber,
    projectName: order.projectName,
    senderUserName: 'mahfujurrahm535',
    createdAt: new Date(),
  };

  await prisma.notification.create({
    data: {
      recipient: 'USER',
      message: ``,
      senderId: order.userId as string,
      payload: payload,
      recipientId: order.userId as string,
    },
  });
  PublicMessageHandler(
    {
      msg: ``,
      deliveryDate: order.deliveryDate,
      projectName: order.projectName,
      projectNumber: projectNumber,
      senderUserName: 'mahfujurrahm535',
      type: NotificationTypes.FileDelivered,
      thumbnailUrl: order?.projectImage,
      createdAt: new Date(),
      userId: order.userId,
    },
    'ADMIN',
  );

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    data: order,
    message: 'Delivery accepted successfully',
  });
});

export const OrderDelivarController = {
  DeliveredOrders,
  handleDeliveryResponse,
  OrderDelivardStatus,
};
