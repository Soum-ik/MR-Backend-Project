import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import { prisma } from '../../../libs/prismaHelper';
import sendResponse from '../../../libs/sendResponse';
import catchAsync from '../../../libs/utlitys/catchSynch';
import { OrderStatus, ProjectStatus } from '../Order_page.constant';

interface deliverProjectT {
  isRevision: boolean;
  isAccepted: boolean;
  thumbnailImage: object;
  attachments: Array<object>;
}

const DeliveredOrders = catchAsync(async (req: Request, res: Response) => {
  const { projectNumber, uniqueId, updatedMessage, userId } = req.body;

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
