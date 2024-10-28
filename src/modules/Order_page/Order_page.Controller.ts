// import type { Request, Response } from "express";
// import httpStatus from "http-status";
// import { z } from "zod";
// import { prisma } from "../../libs/prismaHelper";
// import sendResponse from "../../libs/sendResponse";

// export const answerRequirements = async (req: Request, res: Response) => {
//   try {
//     const { orderId, answers } = req.body;

//     // Check if order exists
//     const order = await prisma.order.findUnique({ where: { id: orderId } });
//     if (!order) {
//       return sendResponse
//     }

//     // Validate answers structure
//     if (!Array.isArray(answers) || answers.some(answer => !answer.question || !answer.answer)) {
//       return res.status(400).json({ error: 'Invalid answers format. Each answer must contain a question and an answer.' });
//     }

//     // Create RequirementAnswer entries
//     const createdAnswers = await prisma.requirementAnswer.createMany({
//       data: answers.map(answer => ({
//         orderId,
//         question: answer.question,
//         answer: answer.answer,
//       })),
//     });

//     res.status(201).json({
//       message: 'Answers successfully saved',
//       createdAnswers,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Failed to save answers' });
//   }
// };

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
