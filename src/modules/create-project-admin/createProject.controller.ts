import type { Request, Response } from 'express';
import httpStatus from 'http-status';
import { prisma } from '../../libs/prismaHelper';
import sendResponse from '../../libs/sendResponse';


const createProject = (req: Request, res: Response) => {
    const { } = req.body;
}