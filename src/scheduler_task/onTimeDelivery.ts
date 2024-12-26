import schedule from 'node-schedule';
import { print } from '../helper/colorConsolePrint.ts/colorizedConsole';
import { prisma } from '../libs/prismaHelper';


schedule.scheduleJob('*/10 * * * * *', async () => {
    print.blue('Scheduler running to check for late deliveries...');

    try {
        await prisma.order.updateMany({
            where: {
                projectStatus: "Canceled",
                isLateDelivery: true
            },
            data: {
                isLateDelivery: false
            }
        })
        // Get the current date and time
        const now = new Date();
        let lateDeliveryCount: number = 0; // Counter for late deliveries


        // Find messages with orders that are 'Ongoing' and check delivery status
        const messageList = await prisma.order.findMany({
            where: {
                projectStatus: 'Ongoing',
            },
            select: {
                id: true,
                deliveryDate: true,
                isLateDelivery: true,
            },
        });

        if (messageList.length > 0) {
            await Promise.all(
                messageList.map(async (message) => {
                    const { id, deliveryDate, isLateDelivery } = message;

                    // Check if the delivery date has passed
                    if (deliveryDate && new Date(deliveryDate) < now && !isLateDelivery) {
                        // Update isLateDelivery to true
                        await prisma.order.update({
                            where: { id },
                            data: { isLateDelivery: true },
                        });
                        lateDeliveryCount++;
                    }
                })
            );
        }

        // Print the scheduler completion message with counts
        if (lateDeliveryCount > 0) {
            print.green(
                `Scheduler completed successfully: ${lateDeliveryCount} orders marked as late delivery.`
            );
        } else {
            print.yellow(`Scheduler completed successfully: No updates were made.`);
        }
    } catch (error) {
        print.red(`Error in scheduler: ${error}`, error);
    }
});
