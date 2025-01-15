import { print } from "../../helper/colorConsolePrint.ts/colorizedConsole";
import { prisma } from "../../libs/prismaHelper";

export const updateLastSeen = async (userId: any) => {
    const MAX_RETRIES = 3;
    const INITIAL_DELAY = 100; // Initial delay in milliseconds

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            // Perform an atomic update
            await prisma.user.update({
                where: { id: userId },
                data: { lastSeen: 'Online' },
            });

            print.green(`Updated last seen for user ${userId} to "Online"`);
            return; // Exit the loop if the update succeeds
        } catch (error) {
            if ((error as any).code === 'P2034' && attempt < MAX_RETRIES) {
                const delay = INITIAL_DELAY * Math.pow(2, attempt - 1); // Exponential backoff
                print.yellow(`Retrying update for user ${userId}... Attempt ${attempt} in ${delay}ms`);
                await new Promise((resolve) => setTimeout(resolve, delay));
            } else {
                print.red(`Failed to update last seen for user ${userId}: `, error);
                throw error;
            }
        }
    }
};

export const updateLastSeenDisconnect = async (userId: any) => {
    const MAX_RETRIES = 3;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            await prisma.user.update({
                where: { id: userId },
                data: { lastSeen: new Date().toISOString().toString() },
            });
            print.green(`Updated last seen for user ${userId} to "Online"`);
            break; // Exit the loop if the update succeeds
        } catch (error) {
            if ((error as any).code === 'P2034' && attempt < MAX_RETRIES) {
                print.yellow(`Retrying update for user ${userId}... Attempt ${attempt}`);
                await new Promise((resolve) => setTimeout(resolve, 100)); // Short delay before retrying
            } else {
                print.red(`Failed to update last seen for user ${userId}: `, error);
                throw error; // Re-throw if retries are exhausted
            }
        }
    }
};
