import type { Request, Response } from "express";
import httpStatus from "http-status";
import { z } from "zod";
import { prisma } from "../../../libs/prismaHelper";
import sendResponse from "../../../libs/sendResponse";


// Create answers to the requirements questions
const answerRequirements = async (req: Request, res: Response) => {
    try {
        const { orderId, answers } = req.body;

        const userData = req.user
        console.log(userData);


        // Check if order exists
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order) {
            return sendResponse<any>(res, {
                statusCode: httpStatus.INTERNAL_SERVER_ERROR,
                success: false,
                message: "Order id are not found",

            });
        }

        // Validate answers structure
        if (!Array.isArray(answers) || answers.some(answer => !answer.question || !answer.answer)) {
            return res.status(400).json({ error: 'Invalid answers format. Each answer must contain a question and an answer.' });
        }

        // Create RequirementAnswer entries
        const createdAnswers = await prisma.requirementAnswer.createMany({
            data: answers.map(answer => ({
                orderId,
                question: answer.question,
                answer: answer.answer,
            })),
        });

        if (createdAnswers) {
            await prisma.order.update({
                where: {
                    id: orderId
                },
                data: {
                    currentStatus: "REQUIREMENTS_SUBMITTED"
                }
            })
            return sendResponse<any>(res, {
                statusCode: httpStatus.CREATED,
                success: true,
                message: "Requirement placed successfully saved & project start",
                data: createdAnswers,
            });
        } else {
            return sendResponse<any>(res, {
                statusCode: httpStatus.NOT_ACCEPTABLE,
                success: false,
                message: "answerd are not placed successfullly"
            })
        }

    } catch (error) {
        if (error instanceof z.ZodError) {
            return sendResponse<any>(res, {
                statusCode: httpStatus.BAD_GATEWAY,
                success: false,
                message: "Validation error",
                data: error,
            });
        }

        return sendResponse<any>(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: "An unexpected error occurred",
            data: error,
        });
    }
};

// Fetch answers for a specific order
const getRequirementsAnswers = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;

        // Check if order exists
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Fetch answers related to the order
        const answers = await prisma.requirementAnswer.findMany({
            where: { orderId },
            select: { question: true, answer: true },
        });

        return sendResponse<any>(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: true,
            message: "Requirement answers fetched successfully",
            data: answers,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return sendResponse<any>(res, {
                statusCode: httpStatus.BAD_GATEWAY,
                success: false,
                message: "Validation error",
                data: error,
            });
        }

        return sendResponse<any>(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: "An unexpected error occurred",
            data: error,
        });

    }
};


export const requirementAnswer = {
    getRequirementsAnswers,
    answerRequirements
}