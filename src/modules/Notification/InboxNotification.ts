import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import { TokenCredential } from '../../libs/authHelper';
import { prisma } from '../../libs/prismaHelper';
import sendResponse from '../../libs/sendResponse';
import catchAsync from '../../libs/utlitys/catchSynch';
import { USER_ROLE } from '../user/user.constant';

const getMessages = catchAsync(async (req: Request, res: Response) => {
  const { user_id, role } = req.user as TokenCredential;

  if (role === USER_ROLE.USER) {
    const allMessages = await prisma.message.findMany({
      where: {
        recipientId: user_id,
        isClientSeen: false,
      },
    });

    const uniqueTotalInboxMessages = allMessages.filter(
      (msg, i, arr) =>
        i === arr.findIndex((t) => t.commonkey === msg.commonkey),
    ).length;

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      data: {
        total: uniqueTotalInboxMessages,
      },
      message: 'Total inbox message',
    });
  } else {
    const allMessages = await prisma.message.findMany({
      where: {
        recipientId: user_id,
        isAdminSeen: false,
      },
    });

    const uniqueTotalInboxMessages = allMessages.filter(
      (msg, i, arr) =>
        i === arr.findIndex((t) => t.commonkey === msg.commonkey),
    ).length;

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      data: {
        total: uniqueTotalInboxMessages,
      },
      message: 'Total inbox message',
    });
  }
});

const getNotifications = catchAsync(async (req: Request, res: Response) => {
  const { user_id, role } = req.user as TokenCredential;

  const admins = ['ADMIN', 'SUPER_ADMIN', 'SUB_ADMIN'].includes(role);
  if (admins) {
    const allNotifications = await prisma.notification.findMany({
      where: {
        recipient: 'ADMIN',
      },
    });

    const filteredNotifications = allNotifications.filter((notification) => {
      const payload = notification.payload;
      return (
        payload &&
        typeof payload === 'object' &&
        'type' in payload &&
        payload.type !== 'Message'
      );
    });


    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      data: { filteredNotifications },
      message: 'allNotifications',
    });
  } else if (role === USER_ROLE.USER) {
    const allNotifications = await prisma.notification.findMany({
      where: {
        recipient: 'USER',
        recipientId: user_id,
      },
    });

    const filteredNotifications = allNotifications.filter((notification) => {
      const payload = notification.payload;
      return (
        payload &&
        typeof payload === 'object' &&
        'type' in payload &&
        payload.type !== 'Message'
      );
    });

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      data: { filteredNotifications },
      message: 'allNotifications',
    });
  }
});

const getUnseenMessageController = catchAsync(
  async (req: Request, res: Response) => {
    const { user_id, role } = req.user as TokenCredential;
    const { notificationId } = req.params;

    if (role === 'USER') {
      await prisma.notification.update({
        where: {
          id: notificationId,
          recipientId: user_id,
          isClientSeen : false
        },
        data: {
          isClientSeen: true,
        },
      });
    } else {
      const admin = await prisma.notification.findMany({
        where: { recipient: 'ADMIN' },
        select: { isAdminSeen: true },
      });

      await prisma.notification.update({
        where: {
          id: notificationId,
          recipient: 'ADMIN',
        },
        data: {
          isAdminSeen: { push: user_id }, // `push` appends to the array
        },
      });
      return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        data: { admin },
        message: 'update seen message ',
      });
    }
  },
);

const notficationCount = catchAsync(async (req: Request, res: Response) => {
  const { user_id, role } = req.user as TokenCredential;
  let datas;
  if (role === 'USER') {
    datas = await prisma.notification.findMany({
      where: {
        recipientId: user_id,
        isClientSeen: false,
      },
    });
  } else {
    datas = await prisma.notification.findMany({
      where: {
        recipient: 'ADMIN',
        NOT: {
          isAdminSeen: {
            has: user_id,
          },
        },
      },
    });
  }

  const filterdData = datas.filter((data) => {
    const payload = data.payload as { type?: string };
    return payload && payload.type !== 'Message';
  }).length;


  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    data: filterdData,
    message: 'notfication count retrived successfully!',
  });
});

export const InboxNotification = {
  getMessages,
  getNotifications,
  getUnseenMessageController,
  notficationCount,
};
