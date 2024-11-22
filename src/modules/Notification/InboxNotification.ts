import { prisma } from '../../libs/prismaHelper';
import sendResponse from '../../libs/sendResponse';
import catchAsync from '../../libs/utlitys/catchSynch';
import { TokenCredential } from '../../libs/authHelper';
import type { Request, Response } from 'express'
import httpStatus from 'http-status';
import { USER_ROLE } from '../user/user.constant';

const getMessages = catchAsync(async (req: Request, res: Response) => {
    const { user_id, role } = req.user as TokenCredential;


    if (role === USER_ROLE.USER) {
        const allMessages = await prisma.message.findMany({
            where: {
                recipientId: user_id,
                seen: false
            }
        })

        const uniqueTotalInboxMessages = allMessages
            .filter(
                (msg, i, arr) =>
                    i === arr.findIndex((t) => t.commonkey === msg.commonkey),
            ).length

        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            data: {
                total: uniqueTotalInboxMessages
            },
            message: 'Total inbox message'
        })
    }

    const allMessages = await prisma.message.findMany({
        where: {
            seen: false,
            recipient: {
                role: {
                    in: ['ADMIN', 'SUB_ADMIN', 'SUPER_ADMIN', 'USER']
                }
            }
        }
    })
    const uniqueTotalInboxMessages = allMessages
        .filter(
            (msg, i, arr) =>
                i === arr.findIndex((t) => t.commonkey === msg.commonkey),
        ).length

    if (uniqueTotalInboxMessages === 0) {
        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            data: {
                total: uniqueTotalInboxMessages
            },
            message: 'Total inbox message'
        })
    }
    return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        data: {
            total: uniqueTotalInboxMessages
        },
        message: 'Total inbox message'
    })
})


// export const getNotifications = catchAsync(async (req: Request, res: Response) => {
//     const { user_id } = req.user as TokenCredential;

//     const allMessages = await prisma.message.findMany({
//         where: {
//             recipientId: user_id,
//             seen: false
//         }
//     })

//     const uniqueTotalInboxMessages = allMessages
//         .filter(
//             (msg, i, arr) =>
//                 i === arr.findIndex((t) => t.commonkey === msg.commonkey),
//         ).length

//     if (uniqueTotalInboxMessages === 0) {
//         return sendResponse(res, {
//             statusCode: httpStatus.OK,
//             success: true,
//             data: {
//                 total: uniqueTotalInboxMessages
//             },
//             message: 'Total inbox message'
//         })
//     }
// })


export const InboxNotification = {
    getMessages
}

