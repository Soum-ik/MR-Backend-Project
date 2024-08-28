import { prisma } from "../prismaHelper";

export async function getLastSerialNumber() {
    // Check if there is any serial number in the database
    const lastSerialNumberEntry = await prisma.desigserialNumberGenerator.findFirst({
        orderBy: {
            id: 'desc'
        },
        take : 1
    });
 

    if (lastSerialNumberEntry) {
        // Destructure the last entry object
        const { id, serialnumber } = lastSerialNumberEntry

        // Return the destructured object for further manipulation
        return { id, serialnumber };
    } else {
        const number = 1 + ''
        // If no serial numbers exist, you might want to return a new serial number or handle it as needed 
        const { serialnumber, id } = await prisma.desigserialNumberGenerator.create({
            data: {
                serialnumber: number
            }
        })

        return { serialnumber, id };  // or return a new serial number
    }
}
