import type { Request, Response } from "express";
import httpStatus from "http-status";
import { z } from "zod";
import { prisma } from "../../libs/prismaHelper";
import sendResponse from "../../libs/sendResponse";
import { formSchema } from "./contact.validation";

// Define constants
const ADMIN_ROLE = "ADMIN";
const MSG_FROM_ADMIN_NO = "No";

const startContact = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedBody = formSchema.parse(req.body);

    // Check if user information is available
    if (!req.user || !req.user.email || !req.user.user_id) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: "User information is missing or userId is required",
      });
    }

    const { user_id, role } = req.user;
    // Prevent ADMIN from sending messages
    if (role === ADMIN_ROLE) {
      return sendResponse(res, {
        statusCode: httpStatus.FORBIDDEN,
        success: false,
        message: "Admins are not allowed to send messages",
      });
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
      },
    });

    const { id: contactForChatId } = contactEntry;

    // Fetch admin users
    const admins = await prisma.user.findMany({
      where: { role: ADMIN_ROLE },
      select: { id: true },
    });

    // Check if any admins are available
    if (admins.length === 0) {
      return sendResponse(res, {
        statusCode: httpStatus.NOT_FOUND,
        success: false,
        message: "No admin users found",
      });
    }

    // Select a random admin
    const date = new Date();
    const msgDate = date.toLocaleDateString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const msgTime = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    // Create new message entries for all admins
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
          timeAndDate: validatedBody.timeAndDate?.toString() ?? '',
          // contactForChatId,
          isFromAdmin: MSG_FROM_ADMIN_NO,
          msgDate,
          msgTime,
        },
      })
    ));

    console.log("Message created:", newMessages);

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Contact created successfully",
      data: contactEntry,
    });
  } catch (error) {
    // Handle validation errors from Zod
    if (error instanceof z.ZodError) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: "Validation failed",
        data: error.errors,
      });
    }

    // Log unexpected errors for debugging
    console.error("Internal Server Error:", error);

    return sendResponse(res, {
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      success: false,
      message: "Internal server error",
    });
  }
};

export { startContact };
