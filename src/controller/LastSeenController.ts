import { Request, Response } from "express";
import { prisma } from "../libs/prismaHelper";

export const trackLastSeen = async (req: Request, res: Response) => {
    const { userId } = req.params;

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { lastSeen: true },
        });

        if (user) {
            return res.status(200).json({ lastSeen: user.lastSeen });
        } else {
            return res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        return res.status(500).json({ message: "Server error", error });
    }
};
