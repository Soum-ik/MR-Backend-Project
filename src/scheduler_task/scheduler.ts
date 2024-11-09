import { prisma } from "../libs/prismaHelper";
import { PaymentStatus } from "@prisma/client";
import schedule from "node-schedule";
import { print } from "../helper/colorConsolePrint.ts/colorizedConsole";

schedule.scheduleJob('*/10 * * * * *', async () => {
    print.blue('Scheduler running to delete pending payments...');
    
    try {
        const payment = await prisma.payment.deleteMany({
            where: {
                status: PaymentStatus.PENDING
            }
        });

        if (payment.count > 0) {
            print.green(` ${payment.count} pending payments deleted`);
        }
    } catch (error) {
        print.red(`Error in scheduler: ${error}`, error);
    }
});
