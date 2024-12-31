import { Role, User } from '@prisma/client';
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { v4 as uuidv4 } from 'uuid';
import { TokenCredential } from '../../../libs/authHelper';
import { prisma } from '../../../libs/prismaHelper';
import sendResponse from '../../../libs/sendResponse';
import catchAsync from '../../../libs/utlitys/catchSynch';
import { USER_ROLE } from '../../user/user.constant';
import AppError from '../../../errors/AppError';
import PublicMessageHandler, { ADMINLOGO } from '../../../socket/handlers/PublicMessageHandler';
import { NotificationTypes } from '../../../constants/Notification';
import { userFinder } from '../../../utils/userFinder';

// Controller: Send a message
const sendMessage = catchAsync(async (req: Request, res: Response) => {
  const { user_id, role } = req.user as TokenCredential;


  if (!user_id) {
    return sendResponse<any>(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Token are required!',
    });
  }
  const user = await prisma.user.findUnique({
    where: {
      id: user_id as string,
    },
  });
  const {
    messageText,
    attachment,
    replyTo,
    customOffer,
    recipientId,
    projectNumber,
    timeAndDate,
    imageComments,
    additionalOffer,
    deliverProject,
    extendDeliveryTime,
    cancelProject,
    uniqueId,
  } = req.body;

  // If the role is admin, recipientId is required
  if (
    ['ADMIN', 'SUB_ADMIN', 'SUPER_ADMIN'].includes(role as string) &&
    !recipientId
  ) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Recipient ID is required for admin roles.',
    });
  }

  const admins = await prisma.user.findMany({
    where: {
      role: {
        in: ['ADMIN', 'SUB_ADMIN', 'SUPER_ADMIN'],
      },
    },
    select: {
      id: true,
      userName: true,
      role: true,
    },
  });


  const commonkey = uuidv4();

  if (role === 'USER') {
    // Send message to all admins if the role is USER
    for (const admin of admins) {
      const message = await prisma.orderMessage.create({
        data: {
          senderId: user_id as string,
          userImage: user?.image,
          senderName: user?.fullName,
          senderUserName: user?.userName,
          recipientId: admin.id,
          messageText,
          attachment,
          replyTo,
          isFromAdmin: role as Role,
          customOffer,
          timeAndDate: timeAndDate.toString(),
          commonKey: commonkey,
          projectNumber: projectNumber,
          imageComments,
          deliverProject,
          extendDeliveryTime,
          additionalOffer,
          cancelProject,
          uniqueId,
          isClientSeen: true
        },
      });
    }
    const userData = (await userFinder(user_id)) as User;
    PublicMessageHandler(
      {
        type: NotificationTypes.OrderMessage,
        createdAt: new Date(),
        senderUserName: userData.userName,
        avatar: userData.image,
        senderId: user_id,
        message: messageText,
        projectNumber: projectNumber,
        projectImage: "testing images"
      },
      "USER"
    );

    const payload = {
      type: NotificationTypes.OrderMessage,
      createdAt: new Date(),
      senderUserName: userData.userName,
      avatar: userData.image,
      message: messageText,
      senderId: user_id,
      projectNumber: projectNumber,
    }
    await prisma.notification.create({
      data: {
        senderId: user_id as string,
        recipient: 'ADMIN',
        payload: payload,
        message: messageText, // Associate the message with the notification
        isClientSeen: true
      },
    });

    return sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: 'Messages sent to all admins successfully.',
    });
  } else {
    const message = await prisma.orderMessage.create({
      data: {
        senderId: user_id as string,
        userImage: user?.image,
        senderName: user?.fullName,
        senderUserName: user?.userName,
        recipientId,
        messageText,
        attachment,
        replyTo,
        isFromAdmin: role as Role,
        customOffer,
        timeAndDate: timeAndDate.toString(),
        commonKey: commonkey,
        projectNumber: projectNumber,
        imageComments,
        deliverProject,
        extendDeliveryTime,
        additionalOffer,
        cancelProject,
        uniqueId,
        isAdminSeen: true
      },
    });
    const userData = (await userFinder(user_id)) as User;

    if (message.additionalOffer) {
      PublicMessageHandler({
        type: NotificationTypes.AdditionalOffer,
        createdAt: new Date(),
        senderUserName: "mahfujurrahm535",
        avatar: ADMINLOGO,
        message: messageText,
        userId: recipientId
      }, 'ADMIN')

      const payload = {
        type: NotificationTypes.AdditionalOffer,
        avatar: ADMINLOGO,
        senderUserName: "mahfujurrahm535",
        message: messageText,
        recipientId: recipientId,
        projectNumber: projectNumber,
        createdAt: new Date(),
      }
      await prisma.notification.create({
        data: {
          senderId: user_id as string,
          recipient: 'USER',
          payload: payload,
          recipientId: recipientId, // Notification goes to each admin
          message: messageText, // Associate the message with the notification
          isAdminSeen: [user_id],
        },
      });

      return
    } else {
      PublicMessageHandler({
        type: NotificationTypes.OrderMessage,
        createdAt: new Date(),
        senderUserName: "mahfujurrahm535",
        avatar: ADMINLOGO,
        message: messageText,
        userId: recipientId
      }, 'ADMIN')


      const payload = {
        type: NotificationTypes.OrderMessage,
        avatar: ADMINLOGO,
        senderUserName: "mahfujurrahm535",
        message: messageText,
        recipientId: recipientId,
        projectNumber: projectNumber,
        createdAt: new Date(),
      }
      await prisma.notification.create({
        data: {
          senderId: user_id as string,
          recipient: 'USER',
          payload: payload,
          recipientId: recipientId, // Notification goes to each admin
          message: messageText, // Associate the message with the notification
          isAdminSeen: [user_id],
        },
      });
    }



    // Send message to all admins
    for (const admin of admins) {
      if (admin.id !== user_id) {
        // If the admin is not the sender
        const messageToAdmin = await prisma.orderMessage.create({
          data: {
            senderId: user_id as string,
            userImage: user?.image,
            senderName: user?.fullName,
            senderUserName: user?.userName,
            recipientId: admin.id,
            messageText,
            attachment,
            replyTo,
            isFromAdmin: role as Role,
            customOffer,
            timeAndDate: timeAndDate.toString(),
            commonKey: commonkey,
            projectNumber: projectNumber,
            imageComments,
            deliverProject,
            extendDeliveryTime,
            additionalOffer,
            cancelProject,
            uniqueId,
            isAdminSeen: true
          },
        });

        const userData = (await userFinder(recipientId)) as User;

        if (messageToAdmin.additionalOffer) {
          PublicMessageHandler({
            type: NotificationTypes.AdditionalOffer,
            createdAt: new Date(),
            senderUserName: "mahfujurrahm535",
            avatar: ADMINLOGO,
            message: messageText,
            userId: recipientId,

          }, 'ADMINS')
        } else {
          PublicMessageHandler({
            type: NotificationTypes.Message,
            createdAt: new Date(),
            senderUserName: "mahfujurrahm535",
            avatar: ADMINLOGO,
            message: `Admin: ${user?.fullName} send to ${userData.userName} -> ` + messageText,
            admindId: user_id
          }, 'ADMINS')

          const payload = {
            type: NotificationTypes.OrderMessage,
            avatar: ADMINLOGO,
            senderUserName: "mahfujurrahm535",
            message: messageText,
            recipientId: recipientId,
            projectNumber: projectNumber,
            createdAt: new Date(),
          }

          await prisma.notification.create({
            data: {
              senderId: user_id as string,
              recipient: 'ADMIN',
              payload: payload,
              message: messageText, // Associate the message with the notification
            },
          });
        }

      }
    }

    return sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      data: message,
      message: `Message sent to recipient ID: ${recipientId}`,
    });
  }
})

// Controller: Reply to a message
export const replyToMessage = async (req: Request, res: Response) => {
  const { role, user_id } = req.user as TokenCredential;

  const { messageId, ...replyData } = req.body;

  if (!messageId) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Message ID is required to reply.',
    });
  }

  try {
    const message = await prisma.orderMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return sendResponse(res, {
        statusCode: httpStatus.NOT_FOUND,
        success: false,
        message: 'Message not found!',
      });
    }

    const replyMessage = await prisma.orderMessage.update({
      where: { id: messageId },
      data: { replyTo: replyData },
    });

    const user = await prisma.user.findUnique({
      where: { id: user_id as string },
    });

    if (!user?.archive) {
      // await prisma.notification.create({
      //   data: {
      //     senderLogo: user?.image,
      //     type: 'message',
      //     senderUserName: user?.userName ?? 'Unknown',
      //     recipientId: message.recipientId as string,
      //     messageId: message.id,
      //   },
      // });
    }

    return sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      data: replyMessage,
      message: `Message replied successfully to recipient ID: ${message.recipientId}`,
    });
  } catch (error) {
    console.error(error);
    return sendResponse(res, {
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      success: false,
      message: 'Error replying to message.',
    });
  }
};

// Controller: Get messages between user and admin
export const getMessages = async (req: Request, res: Response) => {
  const { userId, projectNumber } = req.query;
  const { user_id, role } = req.user as TokenCredential;

  if (!projectNumber) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'project number need!',
    });
  }

  try {
    const roleCondition = role === 'USER' ? 'asc' : 'asc';
    const messages = await prisma.orderMessage.findMany({
      where: {
        projectNumber: projectNumber as string,
        OR: [
          {
            senderId: user_id as string,
            recipient: {
              role: {
                in: [
                  USER_ROLE.ADMIN,
                  USER_ROLE.SUPER_ADMIN,
                  USER_ROLE.SUB_ADMIN,
                  USER_ROLE.USER,
                ],
              },
            },
          },
          {
            recipientId: user_id as string,
            sender: {
              role: {
                in: [
                  USER_ROLE.ADMIN,
                  USER_ROLE.SUPER_ADMIN,
                  USER_ROLE.SUB_ADMIN,
                  USER_ROLE.USER,
                ],
              },
            },
          },
        ],
      },
      orderBy: { createdAt: roleCondition },
    });

    const uniqueMessages = messages
      .filter(
        (msg, i, arr) =>
          i === arr.findIndex((t) => t.commonKey === msg.commonKey),
      )
      .map(({ ...rest }) => rest);

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      data: uniqueMessages,
      message: `Messages retrieved${messages.length ? '' : ' (none found)'} between user ${user_id} and admins.`,
    });
  } catch (error) {
    console.error(error);
    return sendResponse(res, {
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      success: false,
      message: 'Error retrieving messages.',
    });
  }
};

// Controller: Delete a message
const deleteMessage = catchAsync(async (req: Request, res: Response) => {
  const { uniqueId, projectNumber } = req.params;

  const message = await prisma.orderMessage.findMany({
    where: {
      uniqueId: uniqueId as string,
      projectNumber: projectNumber
    }
  });

  // Check if message exists
  if (!message) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Message not found!',
    });
  }

  const deleteMessage = await prisma.orderMessage.deleteMany({
    where: {
      uniqueId: uniqueId as string,
      projectNumber: projectNumber
    },
  });


  if (!deleteMessage) {
    throw new AppError(httpStatus.NOT_FOUND, "Message not found!");
  }

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Message deleted successfully',
  });
})

export const updateProjectMessage = catchAsync(
  async (req: Request, res: Response) => {
    const { projectNumber, uniqueId } = req.body;
    const { timeAndDate, id, ...updateBody } = req.body;
    if (!uniqueId) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: 'Order message common key is required',
      });
    }

    const updateMessage = await prisma.orderMessage.updateMany({
      where: { projectNumber: projectNumber, uniqueId: uniqueId },
      data: {
        ...updateBody
      },
    });




    if (!updateMessage) {
      return sendResponse(res, {
        statusCode: httpStatus.NOT_FOUND,
        success: false,
        message: 'Message not found',
      });
    }

    // need to added middleware to send better response
    PublicMessageHandler({
      type: NotificationTypes.OfferReject,
      createdAt: new Date(),
      senderUserName: "mahfujurrahm535",
      avatar: ADMINLOGO,
      projectNumber: projectNumber,

      // message: messageText,
      // userId: recipientId
    }, 'USER')
    const payload = {
      type: NotificationTypes.OfferReject,
      avatar: ADMINLOGO,
      senderUserName: "User",
      message: "User reject the addition offer request",
      projectNumber: projectNumber,
      createdAt: new Date(),
    }

    await prisma.notification.create({
      data: {
        senderId: projectNumber as string,
        recipient: 'ADMIN',
        payload: payload,
        message: "User reject the addition offer request", // Associate the message with the notification
      },
    });



    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      data: updateMessage,
      message: 'Message updated successfully',
    });
  },
);

const updateUnseenMessage = catchAsync(async (req: Request, res: Response) => {
  const { user_id, role } = req.user as TokenCredential;
  const { projectNumber } = req.params;

  const updateData = {
    isClientSeen: role === 'USER' ? true : undefined,
    isAdminSeen: ['ADMIN', 'SUB_ADMIN', 'SUPER_ADMIN'].includes(role as string) ? true : undefined,
  };

  const updateUnseenMessage = await prisma.orderMessage.updateMany({
    where: {
      projectNumber: projectNumber,
      senderId: user_id,
      recipientId: user_id,
    },
    data: updateData,
  });

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    data: updateUnseenMessage,
    message: 'Unseen messages updated successfully',
  });
});

export const orderMessageController = {
  sendMessage,
  replyToMessage,
  getMessages,
  deleteMessage,
  updateProjectMessage,
  updateUnseenMessage
};