import { prisma } from "../../libs/prismaHelper";


export async function checkNameExists(
    tableName: 'folders' | 'subFolders' | 'designs' | 'industries',
    name: string
): Promise<boolean> {
    let result;

    switch (tableName) {
        case 'folders':
            result = await prisma.folders.findUnique({
                where: { name: name },
            });
            break;
        case 'subFolders':
            result = await prisma.subFolders.findUnique({
                where: { name: name },
            });
            break;
        case 'designs':
            result = await prisma.designs.findUnique({
                where: { name: name },
            });
            break;
        case 'industries':
            result = await prisma.industries.findUnique({
                where: { name: name },
            });
            break;
        default:
            throw new Error(`Unknown table: ${tableName}`);
    }

    return result !== null;
}
