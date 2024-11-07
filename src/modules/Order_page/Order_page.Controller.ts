import type { Request, Response } from "express";
import httpStatus from "http-status";
import { z } from "zod";
import { prisma } from "../../libs/prismaHelper";
import sendResponse from "../../libs/sendResponse";

export const findOrder = async (req: Request, res: Response) => {
    try {
        const { projectNumber } = req.params;

        // Check if order exists
        const order = await prisma.order.findUnique({
            where: {
                projectNumber: projectNumber as string
            },
            include: {
                OrderExtensionRequest : true,
                OrderMessage: true,
                RequirementAnswer: true,
                Payment: true,

            }
        });
        if (!order) {
            return sendResponse
        }

        return sendResponse(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: 'Order fetched successfully',
            data: order
        });
    } catch (error) {
        console.error(error);
        return sendResponse(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Failed to fetch order',
        });
    }
};

// // Fetch answers for a specific order
// export const getRequirementsAnswers = async (req: Request, res: Response) => {
//   try {
//     const { orderId } = req.params;

//     // Check if order exists
//     const order = await prisma.order.findUnique({ where: { id: orderId } });
//     if (!order) {
//       return res.status(404).json({ error: 'Order not found' });
//     }

//     // Fetch answers related to the order
//     const answers = await prisma.requirementAnswer.findMany({
//       where: { orderId },
//       select: { question: true, answer: true },
//     });

//     res.status(200).json({
//       message: 'Requirements answers fetched successfully',
//       answers,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Failed to fetch answers' });
//   }
// };
