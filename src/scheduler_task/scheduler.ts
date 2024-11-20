import { print } from "../helper/colorConsolePrint.ts/colorizedConsole";
import { prisma } from "../libs/prismaHelper";
import schedule from 'node-schedule'
import { PaymentStatus } from "../modules/payment/payment.constant";

schedule.scheduleJob('*/10 * * * * *', async () => {
    print.blue('Scheduler running to delete expired payments...');
    
    try {
        // Get the current date and time
        const now = new Date();

        // Delete payments where the createdAt time is more than 4 hours ago
        const payment = await prisma.payment.deleteMany({
            where: {
                status: PaymentStatus.PENDING, // Ensure the status is still PENDING
                createdAt: {
                    lt: new Date(now.getTime() - 4 * 60 * 60 * 1000) // Subtract 4 hours in milliseconds
                }
            }
        });

        if (payment.count > 0) {
            print.green(`${payment.count} expired payments deleted`);
        } else {
            print.yellow('No expired payments to delete.');
        }
    } catch (error) {
        print.red(`Error in scheduler: ${error}`, error);
    }
});
