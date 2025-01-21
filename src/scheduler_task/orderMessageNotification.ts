import { User } from '@prisma/client';
import schedule from 'node-schedule';
import { print } from '../helper/colorConsolePrint.ts/colorizedConsole';
import { messagesTemplate } from '../helper/email/messagesTemplate';
import { sendMail } from '../helper/smtp/AWS_SES';
import { prisma } from '../libs/prismaHelper';
import { userFinder } from '../utils/userFinder';

schedule.scheduleJob('*/1 * * * * *', async () => {
  print.blue('Scheduler running to sending order message notification...');

  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    // const fiveSecondsAgo = new Date(Date.now() - 2 * 1000);

    const messageList = await prisma.orderMessage.findMany({
      where: {
        sendNotification: false,
        createdAt: {
          lte: fiveMinutesAgo,
        },
        NOT: {
          AND: [{ isAdminSeen: true }, { isClientSeen: true }],
        },
      },
      select: {
        recipient: {
          select: {
            role: true,
            id: true,
            userName: true,
            email: true,
            image: true,
          },
        },
        sender: {
          select: {
            userName: true,
            email: true,
            image: true,
            id: true,
          },
        },
        messageText: true,
        uniqueId: true,
        isFromAdmin: true,
        isFromClient: true,
        projectNumber: true,
        attachment: true,
        additionalOffer: true,
        deliverProject: true,
        sendNotification: true,
        createdAt: true,
        isAdminSeen: true,
        isClientSeen: true,
      },
    });

    console.log(messageList, 'checking message list');

    if (messageList.length > 0) {
      const uniqueMessages = Array.from(
        new Map(
          messageList.map((message) => [message.uniqueId, message]),
        ).values(),
      );

      await Promise.all(
        uniqueMessages.map(async (message) => {
          const {
            uniqueId,
            messageText,
            sender: { id: SenderId, userName, email },
            attachment,
            additionalOffer,
            deliverProject,
            projectNumber,
          } = message;

          const userData = (await userFinder(SenderId)) as User;
          await prisma.orderMessage.updateMany({
            where: {
              uniqueId: uniqueId,
            },
            data: {
              sendNotification: true,
            },
          });

          const order = await prisma.order.findUnique({
            where: {
              projectNumber,
            },
          });

          const userEmail = (await userFinder(order?.userId as string)) as User;
          const emailData = {
            clientName:
              userData?.role === 'USER' ? userData.userName : 'Mahfujurrahm535',
            messageText: messageText,
            attachments: attachment as [],
            additionalOffer: additionalOffer as object,
            deliverProject: deliverProject as object,
            projectNumber: projectNumber,
          };

          console.log(userData.email, 'checking email');

          await sendMail({
            to:
              userData?.role === 'USER'
                ? 'mahfujurr321@gmail.com'
                : userEmail.email,
            subject: `You've recieved messages from ${emailData.clientName}`,
            html: messagesTemplate(emailData),
          });
        }),
      );
    }
  } catch (error) {
    print.red(`Error in scheduler: ${error}`, error);
  }
});
