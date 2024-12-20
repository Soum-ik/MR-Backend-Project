import schedule from 'node-schedule';
import { print } from '../helper/colorConsolePrint.ts/colorizedConsole';
import { prisma } from '../libs/prismaHelper';
import { deliverProjectT } from '../modules/payment/payment.interface';
import { ProjectStatus } from '@prisma/client';
import { OrderStatus } from '../modules/Order_page/Order_page.constant';


function isDeliverProjectT(offer: unknown): offer is deliverProjectT {
    if (typeof offer !== 'object' || offer === null) return false;

    const maybeOffer = offer as Partial<deliverProjectT>;

    return (
        typeof maybeOffer.isRevision === 'boolean' &&
        typeof maybeOffer.isAccepted === 'boolean' &&
        typeof maybeOffer.thumbnailImage === 'object' &&
        Array.isArray(maybeOffer.attachments) &&
        maybeOffer.attachments.every(item => typeof item === 'object')
    );
}

schedule.scheduleJob('*/10 * * * * *', async () => {
    print.blue('Scheduler running to withdraw the delivery project');

    try {
        // Get the current date and time
        const now = new Date();

        // Find messages with expired deliver offers (created more than 48 hours ago)
        const messageList = await prisma.orderMessage.findMany({
            where: {
                deliverProject: {
                    not: null,
                },
                createdAt: {
                    lt: new Date(now.getTime() - 48 * 60 * 60 * 1000), // Subtract 48 hours in milliseconds
                },
            },
            select: {
                projectNumber: true,
                uniqueId: true,
                deliverProject: true,
            },
        });

        if (messageList.length > 0) {
            await Promise.all(
                messageList.map(async (message) => {
                    const { deliverProject, projectNumber, uniqueId } = message;

                    const { isAccepted, ...rest } =
                        deliverProject as unknown as deliverProjectT;

                    const updateOffer = {
                        isAccepted: true,
                        ...rest,
                    };

                    if (isDeliverProjectT(deliverProject)) {
                        print.yellow(`Processing custom offer for message: ${uniqueId}.`);

                        try {
                            await prisma.orderMessage.updateMany({
                                where: {
                                    uniqueId: uniqueId,
                                    projectNumber
                                },
                                data: {
                                    deliverProject: updateOffer,
                                },
                            });

                            await prisma.order.update({
                                where: {
                                    projectNumber
                                },
                                data: {
                                    adminDeliveryRequest: true,
                                    clientApproval: true,
                                    projectStatus: ProjectStatus.Completed,
                                    trackProjectStatus: OrderStatus.COMPLETE_PROJECT,
                                    submittedData: updateOffer,
                                    deliveryAttempt: 2,
                                    projectThumbnail: updateOffer?.thumbnailImage?.url as unknown as string,
                                    completedDate: new Date()
                                }
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
