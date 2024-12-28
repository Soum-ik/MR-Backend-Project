import { User } from '@prisma/client';
import { type Request, type Response } from 'express';
import httpStatus from 'http-status';
import { NotificationTypes } from '../../../constants/Notification';
import AppError from '../../../errors/AppError';
import { prisma } from '../../../libs/prismaHelper';
import sendResponse from '../../../libs/sendResponse';
import catchAsync from '../../../libs/utlitys/catchSynch';
import PublicMessageHandler from '../../../socket/handlers/PublicMessageHandler';
import { daysToHours } from '../../../utils/dayToHours';
import { userFinder } from '../../../utils/userFinder';
import { extendDeliveryTimeT } from '../../payment/payment.interface';
import { ExtendDeliveryMessage } from './ExtendDelivary.constant';
import { updateDeliveryDate } from './ExtendDelivary.utils';

// Controller for handling user/admin approval
const approveExtensionRequest = catchAsync(
  async (req: Request, res: Response) => {
    const { orderMessageId, approvedByAdmin, orderId } = req.body;

    const extensionRequest = await prisma.orderExtensionRequest.findUnique({
      where: { uniqueMessageId: orderMessageId },
    });

    if (!extensionRequest) {
      throw new AppError(httpStatus.NOT_FOUND, 'Extended request not found');
    }
    // Update approval status based on who is approving
    const updatedRequest = await prisma.orderExtensionRequest.update({
      where: { uniqueMessageId: orderMessageId },
      data: {
        adminApproved: approvedByAdmin,
        userApproved: !approvedByAdmin ? true : extensionRequest.userApproved,
      },
    });

    // Check if both approvals are done
    if (
      updatedRequest.adminApproved === true ||
      updatedRequest.userApproved === true
    ) {
      const findMessage = await prisma.orderMessage.findMany({
        where: {
          uniqueId: (
            extensionRequest.requestJSON as { updateMessageId: string }
          ).updateMessageId,
        },
        take: 1,
      });
      const messageData = findMessage[0];
      const { isAccepted, ...rest } =
        messageData?.extendDeliveryTime as unknown as extendDeliveryTimeT;

      const { days } = rest;

      const orderData = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (orderData) {
        const { duration, durationHours, updatedDeliveryDate } =
          await updateDeliveryDate(orderData, days);
        const updateMessage = {
          isAccepted: true,
          ...rest,
        };

        await prisma.orderMessage.updateMany({
          where: {
            uniqueId: (
              extensionRequest.requestJSON as { updateMessageId: string }
            ).updateMessageId,
          },
          data: {
            extendDeliveryTime: updateMessage,
          },
        });

        const payload = {
          thumbnailUrl: orderData?.projectImage,
          type: NotificationTypes.OrderExtendUser,
          projectNumber: orderData.projectNumber,
          days: orderData.duration,
          hours: orderData.durationHours,
          createdAt: new Date(),
          senderUserName: "mahfujurrahm535",
          avatar: "",
        };

        await prisma.notification.create({
          //
          data: {
            recipient: 'USER',
            message: ``,
            senderId: orderData.userId as string,
            payload: payload,
          },
        });
        PublicMessageHandler(
          {
            thumbnailUrl: orderData?.projectImage,
            type: NotificationTypes.OrderExtendUser,
            projectNumber: orderData.projectNumber,
            days: orderData.duration,
            hours: orderData.durationHours,
            userId: orderData.userId,
            senderUserName: "mahfujurrahm535",
            avatar: "",
            createdAt: new Date(),
          },
          'ADMIN',
        );
        await prisma.order.update({
          where: { id: orderId },
          data: {
            duration: orderData.duration ? duration.toString() : '',
            durationHours: orderData.durationHours
              ? durationHours.toString()
              : '',
            deliveryDate: updatedDeliveryDate,
            totalPrice: (parseFloat(orderData?.totalPrice as string) || 0) + (updateMessage.amount || 0).toString(),
          },
        });
      } else {
        throw new AppError(httpStatus.NOT_FOUND, 'Order not found');
      }

      return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: ExtendDeliveryMessage.EXTEND_DELIVERY_SUCCESS,
        data: updatedRequest,
      });
    }

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: ExtendDeliveryMessage.EXTEND_DELIVERY_FAILED,
      data: updatedRequest,
    });
  },
);

const ExtendDeliveryMessageOption = catchAsync(
  async (req: Request, res: Response) => {
    const data = req.body;

    const updated = await prisma.$transaction(async (prisma) => {
      const findMessage = await prisma.orderMessage.findMany({
        where: {
          uniqueId: data?.updateMessageId,
        },
        take: 1,
      });
      const messageData = findMessage[0];
      const { isAccepted, ...rest } =
        messageData?.extendDeliveryTime as unknown as extendDeliveryTimeT;

      const { days } = rest;

      const orderData = await prisma.order.findUnique({
        where: {
          id: data?.orderId,
        },
      });
      const hours = daysToHours(data?.days || '0');

      const duration = parseInt(orderData?.duration || '0') + days;
      const durationHours = parseInt(orderData?.durationHours || '0') + hours;

      let UpdatedDeliveryDate;
      if (orderData?.startDate && orderData?.durationHours) {
        UpdatedDeliveryDate = new Date(orderData?.startDate);
        UpdatedDeliveryDate.setDate(UpdatedDeliveryDate.getDate() + duration);
      } else if (orderData?.startDate && orderData?.duration) {
        UpdatedDeliveryDate = new Date(orderData?.startDate);
        UpdatedDeliveryDate.setDate(UpdatedDeliveryDate.getDate() + duration);
      }

      const updateMessage = {
        isAccepted: true,
        ...rest,
      };

      await prisma.orderMessage.updateMany({
        where: {
          uniqueId: data?.updateMessageId,
        },
        data: {
          extendDeliveryTime: updateMessage,
        },
      });

      const userData = (await userFinder(orderData?.userId as string)) as User;

      const payload = {
        thumbnailUrl: orderData?.projectImage,
        type: NotificationTypes.OrderExtendAdmin,
        projectNumber: orderData?.projectNumber,
        days: orderData?.duration,
        hours: orderData?.durationHours,
        senderUserName: userData.userName,
        avatar: userData.image,
        createdAt: new Date(),
      };

      await prisma.notification.create({
        //
        data: {
          recipient: 'ADMIN',
          message: ``,
          senderId: orderData?.userId as string,
          isAdminSent: true,
          payload: payload,
        },
      });
      PublicMessageHandler(
        {
          thumbnailUrl: orderData?.projectImage,
          type: NotificationTypes.OrderExtendAdmin,
          projectNumber: orderData?.projectNumber,
          days: orderData?.duration,
          hours: orderData?.durationHours,
          createdAt: new Date(),
          senderUserName: userData?.userName,
          avatar: userData.image,
        },
        'USER',
      );

      await prisma.order.update({
        where: {
          id: data?.orderId,
        },
        data: {
          duration: orderData?.duration ? duration.toString() : '',
          durationHours: orderData?.durationHours
            ? durationHours.toString()
            : '',
          deliveryDate: UpdatedDeliveryDate,
        },
      });
    });

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      data: updated,
      message: 'Delivery date extended successfully',
    });
  },
);

export { approveExtensionRequest, ExtendDeliveryMessageOption };
