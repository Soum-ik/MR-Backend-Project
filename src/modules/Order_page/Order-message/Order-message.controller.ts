import { Role, User } from '@prisma/client';
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { v4 as uuidv4 } from 'uuid';
import { NotificationTypes } from '../../../constants/Notification';
import AppError from '../../../errors/AppError';
import { TokenCredential } from '../../../libs/authHelper';
import { prisma } from '../../../libs/prismaHelper';
import sendResponse from '../../../libs/sendResponse';
import catchAsync from '../../../libs/utlitys/catchSynch';
import PublicMessageHandler, {
  ADMINLOGO,
} from '../../../socket/handlers/PublicMessageHandler';
import { userFinder } from '../../../utils/userFinder';
import { inboxUpdatePayload } from '../../Notification/InboxNotification.interface';
import { USER_ROLE } from '../../user/user.constant';

interface ExtendDelivery {
  isAccepted: boolean;
  isRejected: boolean;
  isWithdrawn: boolean;
}

interface Reply {
  newReply?: boolean;
}

interface Comment {
  newComment?: boolean;
  replies?: Reply[];
}

interface Image {
  comments?: Comment[];
}

interface Message {
  imageComments?: Image[];
}

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
    let message;
    for (const admin of admins) {
      message = await prisma.orderMessage.create({
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
          isClientSeen: true,
        },
      });
    }
    const userData = (await userFinder(user_id)) as User;

    const calculateNewCommentsAndReplies = (message: Message) => {
      const filteredImages =
        message.imageComments?.filter((image) => {
          // Check if any comment in this image has newComment: true
          const hasNewComment = image.comments?.some(
            (comment) => comment.newComment === true,
          );

          // Check if any comment has replies with newReply: true
          const hasNewReply = image.comments?.some((comment) =>
            comment.replies?.some((reply) => reply.newReply === true),
          );

          // Return true if either hasNewComment or hasNewReply is true
          return hasNewComment || hasNewReply;
        }) || [];

      // Calculate total new comments
      const totalNewComments = filteredImages.reduce((total, img) => {
        const newCommentsCount =
          img.comments?.filter((c) => c.newComment).length || 0;

        const newRepliesCount =
          img.comments
            ?.map((c) => c.replies?.filter((r) => r.newReply).length || 0)
            .reduce((sum, count) => sum + count, 0) || 0;

        return total + newCommentsCount + newRepliesCount;
      }, 0);

      return totalNewComments;
    };
    const total = calculateNewCommentsAndReplies(message as unknown as Message);

    if (message?.imageComments && total > 0) {
      PublicMessageHandler(
        {
          type: NotificationTypes.Comment,
          createdAt: new Date(),
          senderUserName: userData.userName,
          avatar: userData.image,
          message: messageText,
          userId: user_id,
          projectNumber: projectNumber,
          commentQuantity: total,
        },
        'USER',
      );

      const payload = {
        type: NotificationTypes.Comment,
        createdAt: new Date(),
        senderUserName: userData.userName,
        avatar: userData.image,
        message: 'Image Comments',
        userId: user_id,
        projectNumber: projectNumber,
        commentQuantity: total,
      };
      await prisma.notification.create({
        data: {
          senderId: user_id as string,
          recipient: 'ADMIN',
          payload: payload,
          message: messageText, // Associate the message with the notification
          isClientSeen: true,
        },
      });
    } else {
      PublicMessageHandler(
        {
          type: NotificationTypes.OrderMessage,
          createdAt: new Date(),
          senderUserName: userData.userName,
          avatar: userData.image,
          senderId: user_id,
          message: messageText,
          projectNumber: projectNumber,
          projectImage: 'testing images',
        },
        'USER',
      );

      const payload = {
        type: NotificationTypes.OrderMessage,
        createdAt: new Date(),
        senderUserName: userData.userName,
        avatar: userData.image,
        message: messageText,
        senderId: user_id,
        projectNumber: projectNumber,
      };

      // Check if a notification already exists for the sender and recipient
      const existingNotification = await prisma.notification.findMany({
        where: {
          recipient: 'ADMIN',
        },
      });

      const existingPayload = existingNotification.find((d) => {
        const payload = d.payload as unknown as inboxUpdatePayload;
        return (
          payload.type === NotificationTypes.OrderMessage &&
          payload.projectNumber === projectNumber
        );
      });

      if (existingPayload) {
        // Prepare the data for the update
        const updateData = {
          payload: payload, // Update the payload
          message: messageText, // Update the message
          createdAt: new Date(), // Update the timestamp
          isAdminSeen: [],
        };

        // Update the existing notification
        await prisma.notification.update({
          where: {
            id: existingPayload.id, // Use the ID of the existing notification
          },
          data: updateData,
        });
      } else {
        // Create a new notification if it doesn't exist
        await prisma.notification.create({
          data: {
            senderId: user_id as string,
            recipient: 'ADMIN',
            payload: payload,
            message: messageText,
            isClientSeen: true,
          },
        });
      }
    }

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
        isAdminSeen: true,
      },
    });
    const userData = (await userFinder(user_id)) as User;
    const offer = message?.extendDeliveryTime as unknown as ExtendDelivery;

    const calculateNewCommentsAndReplies = (message: Message) => {
      const filteredImages =
        message.imageComments?.filter((image) => {
          // Check if any comment in this image has newComment: true
          const hasNewComment = image.comments?.some(
            (comment) => comment.newComment === true,
          );

          // Check if any comment has replies with newReply: true
          const hasNewReply = image.comments?.some((comment) =>
            comment.replies?.some((reply) => reply.newReply === true),
          );

          // Return true if either hasNewComment or hasNewReply is true
          return hasNewComment || hasNewReply;
        }) || [];

      // Calculate total new comments
      const totalNewComments = filteredImages.reduce((total, img) => {
        const newCommentsCount =
          img.comments?.filter((c) => c.newComment).length || 0;

        const newRepliesCount =
          img.comments
            ?.map((c) => c.replies?.filter((r) => r.newReply).length || 0)
            .reduce((sum, count) => sum + count, 0) || 0;

        return total + newCommentsCount + newRepliesCount;
      }, 0);

      return totalNewComments;
    };
    const total = calculateNewCommentsAndReplies(message as unknown as Message);

    if (message.additionalOffer) {
      PublicMessageHandler(
        {
          type: NotificationTypes.AdditionalOffer,
          createdAt: new Date(),
          senderUserName: 'mahfujurrahm535',
          avatar: ADMINLOGO,
          message: messageText,
          userId: recipientId,
          projectNumber : projectNumber,
        },
        'ADMIN',
      );

      const payload = {
        type: NotificationTypes.AdditionalOffer,
        avatar: ADMINLOGO,
        senderUserName: 'mahfujurrahm535',
        message: messageText,
        recipientId: recipientId,
        projectNumber: projectNumber,
        createdAt: new Date(),
      };
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
    } else if (message.cancelProject && !message.isCancelled) {
      PublicMessageHandler(
        {
          type: NotificationTypes.CancelOffer,
          createdAt: new Date(),
          senderUserName: 'mahfujurrahm535',
          avatar: ADMINLOGO,
          message: messageText,
          userId: recipientId,
          projectNumber,
        },
        'ADMIN',
      );

      const payload = {
        type: NotificationTypes.CancelOffer,
        avatar: ADMINLOGO,
        senderUserName: 'mahfujurrahm535',
        message: messageText,
        recipientId: recipientId,
        projectNumber: projectNumber,
        createdAt: new Date(),
      };
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
    } else if (
      message.extendDeliveryTime &&
      !offer.isAccepted &&
      !offer.isRejected &&
      !offer.isWithdrawn
    ) {
      PublicMessageHandler(
        {
          type: NotificationTypes.OrderExtend,
          createdAt: new Date(),
          senderUserName: 'mahfujurrahm535',
          avatar: ADMINLOGO,
          message: messageText,
          userId: recipientId,
          projectNumber,
        },
        'ADMIN',
      );

      const payload = {
        type: NotificationTypes.OrderExtend,
        avatar: ADMINLOGO,
        senderUserName: 'mahfujurrahm535',
        message: messageText,
        recipientId: recipientId,
        projectNumber: projectNumber,
        createdAt: new Date(),
      };
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
    } else if (message.imageComments && total) {
      PublicMessageHandler(
        {
          type: NotificationTypes.Comment,
          createdAt: new Date(),
          senderUserName: 'mahfujurrahm535',
          avatar: ADMINLOGO,
          message: messageText,
          userId: recipientId,
          projectNumber,
        },
        'ADMIN',
      );

      const payload = {
        type: NotificationTypes.Comment,
        avatar: ADMINLOGO,
        senderUserName: 'mahfujurrahm535',
        message: messageText,
        recipientId: recipientId,
        projectNumber: projectNumber,
        createdAt: new Date(),
      };
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
    } else {
      PublicMessageHandler(
        {
          type: NotificationTypes.OrderMessage,
          createdAt: new Date(),
          senderUserName: 'mahfujurrahm535',
          avatar: ADMINLOGO,
          message: messageText,
          userId: recipientId,
          projectNumber,
        },
        'ADMIN',
      );

      const payload = {
        type: NotificationTypes.OrderMessage,
        avatar: ADMINLOGO,
        senderUserName: 'mahfujurrahm535',
        message: messageText,
        recipientId: recipientId,
        projectNumber: projectNumber,
        createdAt: new Date(),
      };

      // Check if a notification already exists for the sender and recipient
      const existingNotification = await prisma.notification.findMany({
        where: {
          recipient: 'USER',
          recipientId: recipientId, // Ensure the notification is for the same recipient
        },
      });

      const existingPayload = existingNotification.find((d) => {
        const payload = d.payload as unknown as inboxUpdatePayload;
        return (
          payload.type === NotificationTypes.OrderMessage &&
          payload.projectNumber === projectNumber &&
          payload.recipientId === recipientId
        );
      });
      if (existingPayload) {
        // Update the existing notification
        await prisma.notification.update({
          where: {
            id: existingPayload.id, // Use the ID of the existing notification
          },
          data: {
            payload: payload,
            message: messageText,
            isAdminSeen: [],
            isClientSeen: false,
          },
        });
      } else {
        // Create a new notification if it doesn't exist
        await prisma.notification.create({
          data: {
            senderId: user_id as string,
            recipient: 'USER',
            payload: payload,
            recipientId: recipientId, // Notification goes to the specific recipient
            message: messageText, // Associate the message with the notification
            isAdminSeen: [user_id], // Initialize the isAdminSeen array with the user_id
          },
        });
      }
    }

    // Send message to all admins
    // for (const admin of admins) {
    //   if (admin.id !== user_id) {
    //     // If the admin is not the sender
    //     const messageToAdmin = await prisma.orderMessage.create({
    //       data: {
    //         senderId: user_id as string,
    //         userImage: user?.image,
    //         senderName: user?.fullName,
    //         senderUserName: user?.userName,
    //         recipientId: admin.id,
    //         messageText,
    //         attachment,
    //         replyTo,
    //         isFromAdmin: role as Role,
    //         customOffer,
    //         timeAndDate: timeAndDate.toString(),
    //         commonKey: commonkey,
    //         projectNumber: projectNumber,
    //         imageComments,
    //         deliverProject,
    //         extendDeliveryTime,
    //         additionalOffer,
    //         cancelProject,
    //         uniqueId,
    //         isAdminSeen: true
    //       },
    //     });

    //     const userData = (await userFinder(recipientId)) as User;

    //     if (messageToAdmin.additionalOffer) {
    //       PublicMessageHandler({
    //         type: NotificationTypes.AdditionalOffer,
    //         createdAt: new Date(),
    //         senderUserName: "mahfujurrahm535",
    //         avatar: ADMINLOGO,
    //         message: messageText,
    //         userId: recipientId,

    //       }, 'ADMINS')
    //     } else {
    //       PublicMessageHandler({
    //         type: NotificationTypes.Message,
    //         createdAt: new Date(),
    //         senderUserName: "mahfujurrahm535",
    //         avatar: ADMINLOGO,
    //         message: `Admin: ${user?.fullName} send to ${userData.userName} -> ` + messageText,
    //         admindId: user_id
    //       }, 'ADMINS')

    //       const payload = {
    //         type: NotificationTypes.OrderMessage,
    //         avatar: ADMINLOGO,
    //         senderUserName: "mahfujurrahm535",
    //         message: messageText,
    //         recipientId: recipientId,
    //         projectNumber: projectNumber,
    //         createdAt: new Date(),
    //       }

    //       await prisma.notification.create({
    //         data: {
    //           senderId: user_id as string,
    //           recipient: 'ADMIN',
    //           payload: payload,
    //           message: messageText, // Associate the message with the notification
    //         },
    //       });
    //     }

    //   }
    // }

    return sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      data: message,
      message: `Message sent to recipient ID: ${recipientId}`,
    });
  }
});

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
      projectNumber: projectNumber,
    },
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
      projectNumber: projectNumber,
    },
  });

  if (!deleteMessage) {
    throw new AppError(httpStatus.NOT_FOUND, 'Message not found!');
  }

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Message deleted successfully',
  });
});

export const updateProjectMessage = catchAsync(
  async (req: Request, res: Response) => {
    const { user_id, role } = req.user as TokenCredential;

    const { projectNumber, uniqueId } = req.body;
    const { timeAndDate, id, ...updateBody } = req.body;
    if (!uniqueId) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: 'Order message uniqueId is required',
      });
    }

    const updateMessage = await prisma.orderMessage.updateMany({
      where: { projectNumber: projectNumber, uniqueId: uniqueId },
      data: {
        ...updateBody,
      },
    });

    const userData = (await userFinder(user_id)) as User;
    const findOrder = await prisma.orderMessage.findMany({
      where: {
        uniqueId: uniqueId,
      },
      take: 1,
    });
    const offer = findOrder[0].extendDeliveryTime as unknown as ExtendDelivery;

    if (role === 'USER') {
      if (findOrder[0].cancelProject) {
        PublicMessageHandler(
          {
            type: NotificationTypes.CancelOfferReject,
            createdAt: new Date(),
            senderUserName: userData.userName,
            avatar: userData.image,
            projectNumber: projectNumber,
            userId: user_id,
          },
          'USER',
        );

        const payload = {
          type: NotificationTypes.CancelOfferReject,
          avatar: userData.image,
          senderUserName: userData.userName,
          message: `${userData.userName} Cancel Offer Reject`,
          projectNumber: projectNumber,
          createdAt: new Date(),
        };

        await prisma.notification.create({
          data: {
            senderId: user_id as string,
            recipient: 'ADMIN',
            payload: payload,
            message: `${userData.userName} Cancel Offer Reject`, // Associate the message with the notification
          },
        });
      } else if (
        findOrder[0].extendDeliveryTime &&
        !offer.isAccepted &&
        !offer.isRejected &&
        offer.isWithdrawn
      ) {
        PublicMessageHandler(
          {
            type: NotificationTypes.OrderExtendWithdraw,
            createdAt: new Date(),
            senderUserName: userData.userName,
            avatar: userData.image,
            projectNumber: projectNumber,
            userId: user_id,
          },
          'USER',
        );

        const payload = {
          type: NotificationTypes.OrderExtendWithdraw,
          avatar: userData.image,
          senderUserName: userData.userName,
          message: `${userData.userName} withdraw the extension request`,
          projectNumber: projectNumber,
          createdAt: new Date(),
        };

        await prisma.notification.create({
          data: {
            senderId: user_id as string,
            recipient: 'ADMIN',
            payload: payload,
            message: `${userData.userName} Cancel Offer Reject`, // Associate the message with the notification
          },
        });
      } else {
        PublicMessageHandler(
          {
            type: NotificationTypes.OfferReject,
            createdAt: new Date(),
            senderUserName: userData.userName,
            avatar: userData.image,
            projectNumber: projectNumber,
            // message: messageText,
            userId: user_id,
          },
          'USER',
        );

        const payload = {
          type: NotificationTypes.OfferReject,
          avatar: userData.image,
          senderUserName: userData.userName,
          message: `${userData.userName} reject the addition offer request`,
          projectNumber: projectNumber,
          createdAt: new Date(),
        };

        await prisma.notification.create({
          data: {
            senderId: user_id as string,
            recipient: 'ADMIN',
            payload: payload,
            message: `${userData.userName} reject the addition offer request`, // Associate the message with the notification
          },
        });
      }
    } else {
      const findOrderMessage = await prisma.orderMessage.findMany({
        where: {
          uniqueId: uniqueId,
        },
        take: 1,
      });
      const findOrder = await prisma.order.findUnique({
        where: {
          projectNumber: projectNumber,
        },
      });
      if (findOrderMessage[0].cancelProject) {
        PublicMessageHandler(
          {
            type: NotificationTypes.CancelOfferWithdraw,
            createdAt: new Date(),
            senderUserName: 'mahfujurrahm535',
            avatar: ADMINLOGO,
            projectNumber: projectNumber,
            userId: findOrder?.userId,
          },
          'ADMIN',
        );

        const payload = {
          type: NotificationTypes.CancelOfferWithdraw,
          senderUserName: 'mahfujurrahm535',
          avatar: ADMINLOGO,
          message: `mahfujurrahm535 withdrawn the offer`,
          projectNumber: projectNumber,
          createdAt: new Date(),
        };

        await prisma.notification.create({
          data: {
            senderId: user_id as string,
            recipient: 'USER',
            recipientId: findOrder?.userId,
            payload: payload,
            message: `${userData.userName} Cancel Offer Reject`, // Associate the message with the notification
          },
        });
      } else if (
        findOrderMessage[0].extendDeliveryTime &&
        !offer.isAccepted &&
        offer.isRejected &&
        !offer.isWithdrawn
      ) {
        PublicMessageHandler(
          {
            type: NotificationTypes.OrderExtendReject,
            createdAt: new Date(),
            senderUserName: 'mahfujurrahm535',
            avatar: ADMINLOGO,
            projectNumber: projectNumber,
            userId: findOrder?.userId,
          },
          'ADMIN',
        );

        const payload = {
          type: NotificationTypes.OrderExtendReject,
          senderUserName: 'mahfujurrahm535',
          avatar: ADMINLOGO,
          message: `mahfujurrahm535 rejected the extension request`,
          projectNumber: projectNumber,
          createdAt: new Date(),
        };

        await prisma.notification.create({
          data: {
            senderId: user_id as string,
            recipient: 'USER',
            recipientId: findOrder?.userId,

            payload: payload,
            message: `mahfujurrahm535 rejected the extension request`, // Associate the message with the notification
          },
        });
      } else if (
        findOrderMessage[0].extendDeliveryTime &&
        !offer.isAccepted &&
        !offer.isRejected &&
        offer.isWithdrawn
      ) {
        PublicMessageHandler(
          {
            type: NotificationTypes.OrderExtendWithdraw,
            createdAt: new Date(),
            senderUserName: 'mahfujurrahm535',
            avatar: ADMINLOGO,
            projectNumber: projectNumber,
            userId: findOrder?.userId,
          },
          'ADMIN',
        );

        const payload = {
          type: NotificationTypes.OrderExtendWithdraw,
          senderUserName: 'mahfujurrahm535',
          avatar: ADMINLOGO,
          message: `mahfujurrahm535 withdrawn the extension request`,
          projectNumber: projectNumber,
          createdAt: new Date(),
        };

        await prisma.notification.create({
          data: {
            senderId: user_id as string,
            recipient: 'USER',
            recipientId: findOrder?.userId,

            payload: payload,
            message: `mahfujurrahm535 withdrawn the extension request`, // Associate the message with the notification
          },
        });
      } else {
        const findOrder = await prisma.order.findUnique({
          where: {
            projectNumber: projectNumber,
          },
        });

        PublicMessageHandler(
          {
            type: NotificationTypes.AdditionalOfferWithdraw,
            createdAt: new Date(),
            senderUserName: 'mahfujurrahm535',
            avatar: ADMINLOGO,
            projectNumber: projectNumber,
            userId: findOrder?.userId,
          },
          'ADMIN',
        );

        const payload = {
          type: NotificationTypes.AdditionalOfferWithdraw,
          senderUserName: 'mahfujurrahm535',
          avatar: ADMINLOGO,
          message: `mahfujurrahm535 withdrawn the offer`,
          projectNumber: projectNumber,
          createdAt: new Date(),
        };

        await prisma.notification.create({
          data: {
            senderId: user_id as string,
            recipientId: findOrder?.userId,
            recipient: 'USER',
            payload: payload,
            message: `mahfujurrahm535 withdrawn the offer`, // Associate the message with the notification
          },
        });
      }
    }

    if (!updateMessage) {
      return sendResponse(res, {
        statusCode: httpStatus.NOT_FOUND,
        success: false,
        message: 'Message not found',
      });
    }
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
    isAdminSeen: ['ADMIN', 'SUB_ADMIN', 'SUPER_ADMIN'].includes(role as string)
      ? true
      : undefined,
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
  updateUnseenMessage,
};
