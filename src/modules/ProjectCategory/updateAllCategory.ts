import { prisma } from "../../libs/prismaHelper";
import { Request, Response } from "express";
import httpStatus from "http-status";
import sendResponse from "../../libs/sendResponse";
import { z } from "zod";

// Define the expected structure of the request body using zod
const UpdateAllCategorySchema = z.object({
  newOrder: z.array(
    z.object({
      id: z.string(), // Assuming 'id' is a string, change to z.number() if it's a number
    })
  ),
});

type UpdateAllCategoryRequest = Request<{}, {}, z.infer<typeof UpdateAllCategorySchema>>;

export default async function updateAllCategory(req: UpdateAllCategoryRequest, res: Response) {
  if (req.method === "POST") {
    const parseResult = UpdateAllCategorySchema.safeParse(req.body);

    if (!parseResult.success) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        data: null,
        message: "Invalid request body",
      });
    }

    const { newOrder } = parseResult.data; // newOrder should be an array of items with their new positions

    try {
      // Start a transaction to update multiple records
      await prisma.$transaction(
        newOrder.map((item, index) =>
          prisma.category.update({
            where: { id: item.id },
            data: { order: index },
          })
        )
      );

      return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        data: null,
        message: "Order updated successfully",
      });
    } catch (error) {
      console.error("Error updating order:", error);
      return sendResponse(res, {
        statusCode: httpStatus.INTERNAL_SERVER_ERROR,
        success: false,
        data: null,
        message: "Error updating order",
      });
    }
  } else {
    return sendResponse(res, {
      statusCode: httpStatus.METHOD_NOT_ALLOWED,
      success: false,
      data: null,
      message: "Method not allowed",
    });
  }
}
