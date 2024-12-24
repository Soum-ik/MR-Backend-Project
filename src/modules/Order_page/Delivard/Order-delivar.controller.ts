import { print } from './../../../helper/colorConsolePrint.ts/colorizedConsole';
import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import { prisma } from '../../../libs/prismaHelper';
import sendResponse from '../../../libs/sendResponse';
import catchAsync from '../../../libs/utlitys/catchSynch';
import { OrderStatus, ProjectStatus } from '../Order_page.constant';
import PublicMessageHandler from '../../../socket/handlers/PublicMessageHandler';
import { NotificationTypes } from '../../../constants/Notification';
import { userFinder } from '../../../utils/userFinder';
import { TokenCredential } from '../../../libs/authHelper';
import { User } from '@prisma/client';

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
        projectThumbnail: updatedMessage?.deliverProject?.thumbnailImage?.url,
        completedDate: new Date(),
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
      createdAt: new Date(),
    }

    await prisma.notification.create({ //
      data: {
        recipient: 'ADMIN',
        message: ``,
        senderId: userData?.id as string,
        payload: payload
      }
    })
    PublicMessageHandler({
      thumbnailUrl: order?.projectImage,
      projectNumber: projectNumber,
      type: NotificationTypes.CompleteOrder,
      createdAt: new Date(),
    }, 'USER');

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
    const { user_id } = req.user as TokenCredential
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
        createdAt: new Date(),
      }

      await prisma.notification.create({
        data: {
          recipient: 'ADMIN',
          message: `<div className="flex-1">
        <p className="text-sm font-medium sm:text-base text-gray-900 line-clamp-3">
          <span className="font-bold">${userData.userName}: requested </span>a change to
          your order. Review the feedback.
        </p>
      </div>`,
          senderId: userData?.id as string,
          payload: payload
        }
      })
      PublicMessageHandler({
        msg: `<div className="flex-1">
        <p className="text-sm font-medium sm:text-base text-gray-900 line-clamp-3">
          <span className="font-bold">${userData.userName}: requested </span>a change to
          your order. Review the feedback.
        </p>
      </div>
      `,
        deliveryDate: order.deliveryDate,
        projectName: order.projectName,
        projectNumber: projectNumber,
        type: NotificationTypes.Reminder,
        createdAt: new Date(),
      }, 'USER');

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
