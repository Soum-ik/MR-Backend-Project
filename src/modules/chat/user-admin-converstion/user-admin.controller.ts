import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { v4 as uuidv4 } from 'uuid';
import { TokenCredential } from '../../../libs/authHelper';
import { prisma } from '../../../libs/prismaHelper';
import sendResponse from '../../../libs/sendResponse';
import { USER_ROLE } from '../../user/user.constant';
import AppError from '../../../errors/AppError';

// Send a message
const sendMessage = async (req: Request, res: Response) => {
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
    timeAndDate,
    recipientId,
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

  try {
    const converString = timeAndDate.toString();

    const commonkey = uuidv4();

    if (role === 'USER') {
      // Send message to all admins if the role is USER
      for (const admin of admins) {
        const message = await prisma.message.create({
          data: {
            senderId: user_id as string,
            userImage: user?.image,
            senderName: user?.fullName,
            senderUserName: user?.userName,
            recipientId: admin.id,
            messageText,
            attachment,
            replyTo,
            isFromAdmin: role as string,
            customOffer,
            timeAndDate: converString,
            commonkey,
          },
        });

        await prisma.notification.create({
          data: {
            senderLogo: user?.image,
            type: 'message',
            senderUserName: user?.userName ?? 'Unknown',
            recipientId: admin.id, // Notification goes to each admin
            messageId: message.id, // Associate the message with the notification
          },
        });
      }

      return sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: 'Messages sent to all admins successfully.',
      });
    } else {
      const message = await prisma.message.create({
        data: {
          senderId: user_id as string,
          userImage: user?.image,
          senderName: user?.fullName,
          senderUserName: user?.userName,
          recipientId,
          messageText,
          attachment,
          replyTo,
          isFromAdmin: role as string,
          customOffer,
          timeAndDate: converString,
          commonkey,
        },
      });

      await prisma.notification.create({
        data: {
          senderLogo: user?.image,
          type: 'message',
          senderUserName: user?.userName ?? 'Unknown',
          recipientId: recipientId as string, // Notification goes to the recipient
          messageId: message.id, // Associate the message with the notification
        },
      });

      // Send message to all admins
      for (const admin of admins) {
        if (admin.id !== user_id) {
          // If the admin is not the sender
          const messageToAdmin = await prisma.message.create({
            data: {
              senderId: user_id as string,
              userImage: user?.image,
              senderName: user?.fullName,
              senderUserName: user?.userName,
              recipientId: admin.id,
              messageText,
              attachment,
              replyTo,
              isFromAdmin: role as string,
              customOffer,
              timeAndDate: converString,
              commonkey,
            },
          });

          await prisma.notification.create({
            data: {
              senderLogo: user?.image,
              type: 'message',
              senderUserName: user?.userName ?? 'Unknown',
              recipientId: admin.id, // Notification goes to each admin
              messageId: messageToAdmin.id, // Associate the message with the notification
            },
          });
        }
      }

      return sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        data: message,
        message: `Message sent to recipient ID: ${recipientId}`,
      });
    }

    // Create a notification for the recipient
  } catch (error) {
    console.error(error);
    return sendResponse(res, {
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      success: false,
      message: 'Error sending message.',
    });
  }
};


// Update message
const updateMessage = async (req: Request, res: Response) => {
  const { user_id } = req.user as TokenCredential;

  const { messageId } = req.params;

  if (!user_id) {
    return sendResponse<any>(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Token are required!',
    });
  }
  const {
    messageText,
    attachment,
    replyTo,
    customOffer,
    timeAndDate,
  } = req.body;

  const message = await prisma.message.update({
    where: {
      id: messageId,
    },
    data: {
      messageText,
      attachment,
      replyTo,
      customOffer,
      timeAndDate,
    },
  });

  if (!message) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Message not found!',
    });
  }

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    data: message,
    message: 'Message updated successfully',
  });
}

// Reply to a message
const replyToMessage = async (req: Request, res: Response) => {
  const { role, user_id } = req.user as TokenCredential;
  if (!role) {
    return sendResponse<any>(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: 'Token are required!',
    });
  }

  const { messageId, ...allData } = req.body;

  if (!messageId) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: 'Message ID is required! To reply to a message',
    });
  }

  try {
    const message = await prisma.message.findUnique({
      where: {
        id: messageId,
      },
    });

    if (!message) {
      return sendResponse(res, {
        statusCode: httpStatus.NOT_FOUND,
        success: false,
        message: 'Message not found!',
      });
    }

    const replyMessage = await prisma.message.update({
      where: {
        id: messageId,
      },
      data: {
        replyTo: allData,
      },
    });

    const user = await prisma.user.findUnique({
      where: {
        id: user_id as string,
      },
    });

    if (user?.archive) {
      return sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        data: 'user are archive, so there is no notification',
      });
    } else {
      await prisma.notification.create({
        data: {
          senderLogo: user?.image,
          type: 'message',
          senderUserName: user?.userName ?? 'Unknown',
          recipientId: message.recipientId as string, // Notification goes to the recipient
          messageId: message.id, // Associate the message with the notification
        },
      });
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

// Get messages between user and admin
const getMessages = async (req: Request, res: Response) => {
  const { userId } = req.query;
  const { user_id, role } = req.user as TokenCredential;

  if (!user_id) {
    return sendResponse<any>(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: 'Token is required!',
    });
  }

  try {
    if (role === 'USER') {
      const messages = await prisma.message.findMany({
        where: {
          OR: [
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
          ],
        },
        orderBy: { createdAt: 'asc' },
      });

      if (messages.length > 0) {
        const uniqueMessages = messages
          .filter(
            (message, index, self) =>
              index ===
              self.findIndex((t) => t.commonkey === message.commonkey),
          )
          .map(({ commonkey, ...rest }) => rest);

        return sendResponse(res, {
          statusCode: httpStatus.OK,
          success: true,
          data: uniqueMessages,
          message: 'all message recive from user',
        });
      } else {
        return sendResponse(res, {
          statusCode: httpStatus.OK,
          success: true,
          data: [],
          message: 'no message found',
        });
      }
    } else {
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            {
              senderId: userId as string,
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
            {
              recipientId: userId as string,
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
          AND: [{ hiddenFromAdmin: false }],
        },
        orderBy: { createdAt: 'asc' },
      });

      if (messages.length > 0) {
        const uniqueMessages = messages
          .filter(
            (message, index, self) =>
              index ===
              self.findIndex((t) => t.commonkey === message.commonkey),
          )
          .map(({ commonkey, ...rest }) => rest);
        return sendResponse(res, {
          statusCode: httpStatus.OK,
          success: true,
          data: uniqueMessages,
          message: `all message recive from user ${userId}`,
        });
      } else {
        return sendResponse(res, {
          statusCode: httpStatus.OK,
          success: true,
          data: [],
          message: `no message found from user ${userId}`,
        });
      }
    }
  } catch (error) {
    console.error(error);
    return sendResponse(res, {
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      success: false,
      message: 'Error retrieving messages.',
    });
  }
};

// Delete message
const deleteMessage = async (req: Request, res: Response) => {
  const { commonkey } = req.params;
  // const { user_id, role } = req.user as TokenCredential;

  try {
    // Fetch the message from the database
    const message = await prisma.message.findMany({
      where: {
        commonkey: commonkey as string,
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

    const deleteMessage = await prisma.message.deleteMany({
      where: {
        commonkey: commonkey as string,
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

  } catch (error) {
    console.error(error);
    return sendResponse(res, {
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      success: false,
      message: 'Error deleting message.',
    });
  }
};

// Delete conversation
const deleteConversation = async (req: Request, res: Response) => {
  const { user_id, role } = req.user as TokenCredential;
  const { userId } = req.params; // ID of the other participant in the conversation

  if (!user_id) {
    return sendResponse<any>(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: 'Token is required!',
    });
  }
  const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'SUB_ADMIN'].includes(
    role as string,
  );

  if (!isAdmin) {
    return sendResponse(res, {
      statusCode: httpStatus.FORBIDDEN,
      success: false,
      message: 'You are not authorized to delete this conversation',
    });
  }

  try {
    // Update the messages between the user and the recipient (admin or user)
    const result = await prisma.message.updateMany({
      where: {
        OR: [
          { senderId: user_id as string, recipientId: userId },
          { senderId: userId, recipientId: user_id as string },
        ],
      },
      data: {
        hiddenFromAdmin: true,
      },
    });

    if (result.count === 0) {
      return sendResponse(res, {
        statusCode: httpStatus.NOT_FOUND,
        success: false,
        message: 'No messages found to delete.',
      });
    }

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: `Conversation deleted from ${isAdmin ? 'admin' : 'user'} side.`,
    });
  } catch (error) {
    console.error(error);
    return sendResponse(res, {
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      success: false,
      message: 'Error deleting conversation.',
    });
  }
};



export const messageControlller = {
  getMessages,
  replyToMessage,
  sendMessage,
  updateMessage,
  deleteMessage,
  deleteConversation,
};
