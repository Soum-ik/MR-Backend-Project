import { prisma } from "../libs/prismaHelper";


export const userFinder = async (userId: string) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        })

        return user;
    } catch (error) {
        console.log(error);
        return error
    }
}