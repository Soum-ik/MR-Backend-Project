import { prisma } from "../libs/prismaHelper";
import { USER_ROLE } from "../modules/user/user.constant";
export const adminUsers = async () => {
    const adminUser = await prisma.user.findMany({
        where: {
            role: {
                in: [USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN, USER_ROLE.SUB_ADMIN]
            }
        },
        select: {
            id: true,
        }
    })
    return adminUser.map(user => user.id)
}