import schedule from 'node-schedule';
import { print } from '../helper/colorConsolePrint.ts/colorizedConsole';
import { prisma } from '../libs/prismaHelper';
import { USER_ROLE } from '../modules/user/user.constant';



schedule.scheduleJob('*/10  * * * * *', async () => {
    print.blue('Scheduler running to update isClock status');

    try {

        const useList = await prisma.user.findMany({
            where: {
                isClock: false,
                role: {
                    equals: USER_ROLE.USER
                }
            },
            include: {
                receivedMessages: {
                    where: {
                        sender: {
                            role: {
                                in: [USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN, USER_ROLE.SUB_ADMIN]
                            }
                        }
                    }
                }
            }
        });


        for (const user of useList) {
            if (user.receivedMessages.length > 0) {
                await prisma.user.update({
                    where: {
                        id: user.id
                    },
                    data: {
                        isClock: true
                    }
                })
            }
            print.green('Scheduler updated isClock status');
        }
    } catch (error) {
        print.red(`Error in scheduler: ${error}`, error);
    }
});
