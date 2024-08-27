import { prisma } from "../../libs/prismaHelper";

// Helper function to check if an entity exists, and create it if it doesn't
export async function findOrCreateEntity<T>(
    model: any,
    whereCondition: any,
    createData: any
): Promise<T> {
    let entity = await model.findUnique({ where: whereCondition });

    if (!entity) {
        entity = await model.create({ data: createData });
    }

    return entity;
}
