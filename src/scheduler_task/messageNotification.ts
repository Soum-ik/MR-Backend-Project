import { User } from '@prisma/client';
import schedule from 'node-schedule';
import { print } from '../helper/colorConsolePrint.ts/colorizedConsole';
import { messagesTemplate } from '../helper/email/messagesTemplate';
import { sendMail } from '../helper/smtp/AWS_SES';
import { prisma } from '../libs/prismaHelper';
import { userFinder } from '../utils/userFinder';

schedule.scheduleJob('*/1 * * * * *', async () => {
  print.blue('Scheduler running to sending notification...');

  try {
    const fiveMinutesAgo = new Date(Date.now() - 2 * 1000);
    // const fiveSecondsAgo = new Date(Date.now() - 2 * 1000);

    const messageList = await prisma.message.findMany({
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
            role: true,
          },
        },
        messageText: true,
        uniqueId: true,
        isFromClient: true,
        attachment: true,
        contactForm: true,
        customOffer: true,
      },
    });
console.log(messageList, 'messageList');

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
            sender: { id: SenderId, role, userName },
            isFromClient,
            attachment,
            contactForm,
            customOffer,
            recipient: { email },
          } = message;

          const userData = (await userFinder(SenderId)) as User;

          const emailData = {
            clientName:
              userData?.role === 'USER' ? userData.userName : 'Mahfujurrahm535',
            messageText: messageText,
            attachments: attachment as [],
            contactForm: contactForm as object,
            customOffer: customOffer as object,
          };

          console.log(userData.email, 'user dataa');

          await sendMail({
            to: userData?.role === 'USER' ? 'mahfujurrahm535@gmail.com' : email,
            subject: `You've recieved messages from ${emailData.clientName}`,
            html: messagesTemplate(emailData),
          });

          await prisma.message.updateMany({
            where: {
              uniqueId: uniqueId,
            },
            data: {
              sendNotification: true,
            },
          });
        }),
      );
    }
  } catch (error) {
    print.red(`Error in scheduler: ${error}`, error);
  }
});
