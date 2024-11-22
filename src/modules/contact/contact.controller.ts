import { Request, Response } from "express";
import httpStatus from "http-status";
import { prisma } from "../../libs/prismaHelper";
import sendResponse from "../../libs/sendResponse";
import { v4 as uuidv4 } from 'uuid';
import AppError from "../../errors/AppError";

// Define constants
const ADMIN_ROLE = "ADMIN";
const SUB_ADMIN_ROLE = "SUB_ADMIN";
const SUPER_ADMIN_ROLE = "SUPER_ADMIN";


const startContact = async (req: Request, res: Response) => {
    const validatedBody = req.body;

    // Ensure user information is available
    if (!req.user || !req.user.email || !req.user.user_id) {
        return new AppError(httpStatus.BAD_REQUEST, 'User information is missing or userId is required')
    }

    const { user_id, role } = req.user;

    // Restrict ADMIN from sending messages
    if (role === ADMIN_ROLE) {
        return new AppError(httpStatus.FORBIDDEN, 'Admin are not allowed to send message')
    }

    // Create a new contact entry

    const contactEntry = await prisma.contactForChat.create({
        data: {
            email: validatedBody.email ?? '',
            messageText: validatedBody.message,
            exampleDesign: validatedBody.exampleDesign ?? '',
            name: validatedBody.name ?? '',
            website: validatedBody.websiteOrFacebook ?? '',
            userId: user_id,
            senderName: validatedBody.senderName,
            senderUserName: validatedBody.senderUserName,
            userImage: validatedBody.userImage
        },
    });

     

    const { id: contactForChatId } = contactEntry;

    // Fetch admin users
    const admins = await prisma.user.findMany({
        where: { role: { in: [ADMIN_ROLE, SUB_ADMIN_ROLE, SUPER_ADMIN_ROLE] } },
        select: { id: true },
    });

    // Ensure admins exist
    if (!admins.length) {
        return new AppError(httpStatus.NOT_FOUND, 'No admin found')
    }

    const commonkey = uuidv4()

    // Create message entries for each admin
    const newMessages = await Promise.all(admins.map(admin =>
        prisma.message.create({
            data: {
                senderId: user_id,
                recipientId: admin.id,
                messageText: "",
                contactForm: {
                    name: validatedBody.name,
                    email: validatedBody.email,
                    website: validatedBody.websiteOrFacebook,
                    exampleDesign: validatedBody.exampleDesign,
                    messageText: validatedBody.message,
                },
                senderName: validatedBody.senderName,
                senderUserName: validatedBody.senderUserName,
                userImage: validatedBody.userImage,
                timeAndDate: validatedBody.timeAndDate?.toString() ?? '',
                isFromAdmin: "USER",
                commonkey
            },
        })
    ));

    console.log("Messages created:", newMessages);

    return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Contact created successfully",
        data: contactEntry,
    })
};

export { startContact };
