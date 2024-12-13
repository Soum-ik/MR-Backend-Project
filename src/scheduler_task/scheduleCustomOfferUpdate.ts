import schedule from 'node-schedule';
import { print } from '../helper/colorConsolePrint.ts/colorizedConsole';
import { prisma } from '../libs/prismaHelper';

interface CustomOfferI {
  thumbnail: string;
  title: string;
  deliveryCount: string;
  deliveryWay: string;
  price: string;
  desc: string;
  requirements: Array<string>;
  isAccepted: boolean;
  isRejected: boolean;
  isWithdrawn: boolean;
}

function isCustomOfferI(offer: unknown): offer is CustomOfferI {
  if (typeof offer !== 'object' || offer === null) return false;

  const maybeOffer = offer as Partial<CustomOfferI>;

  return (
    typeof maybeOffer.thumbnail === 'string' &&
    typeof maybeOffer.title === 'string' &&
    typeof maybeOffer.deliveryCount === 'string' &&
    typeof maybeOffer.deliveryWay === 'string' &&
    typeof maybeOffer.price === 'string' &&
    typeof maybeOffer.desc === 'string' &&
    Array.isArray(maybeOffer.requirements) &&
    maybeOffer.isAccepted === false &&
    maybeOffer.isRejected === false &&
    maybeOffer.isWithdrawn === false
  );
}

schedule.scheduleJob('*/10 * * * * *', async () => {
  print.blue('Scheduler running to withdraw the custom offer...');

  try {
    // Get the current date and time
    const now = new Date();

    // Find messages with expired custom offers (created more than 48 hours ago)
    const messageList = await prisma.message.findMany({
      where: {
        customOffer: {
          not: null,
        },
        createdAt: {
          lt: new Date(now.getTime() - 48 * 60 * 60 * 1000), // Subtract 48 hours in milliseconds
        },
      },
      select: {
        uniqueId: true,
        customOffer: true,
      },
    });

    if (messageList.length > 0) {
      await Promise.all(
        messageList.map(async (message) => {
          const { uniqueId, customOffer } = message;

          const { isWithdrawn, ...rest } =
            customOffer as unknown as CustomOfferI;

          const updateOffer = {
            isWithdrawn: true,
            ...rest,
          };

          if (isCustomOfferI(customOffer)) {
            print.yellow(`Processing custom offer for message: ${uniqueId}.`);

            try {
              await prisma.message.updateMany({
                where: {
                  uniqueId: uniqueId,
                },
                data: {
                  customOffer: updateOffer,
                },
              });
            } catch (err) {
              print.red(
                `Error updating customOffer for message ${uniqueId}`,
                err,
              );
            }
          }
        }),
      );
    }

    print.green(`${messageList.length} expired messages withdrawn.`);
  } catch (error) {
    print.red(`Error in scheduler: ${error}`, error);
  }
});
