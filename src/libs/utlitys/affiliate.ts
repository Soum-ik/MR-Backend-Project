import { prisma } from "../prismaHelper";

export async function getLastAffiliateSerialNumber() {
    // Check if there is any serial number in the database
    const lastSerialNumberEntry = await prisma.affiliateNumberGenerator.findFirst({
        orderBy: {
            id: 'desc'
        },
        take: 1
    });

    console.log(lastSerialNumberEntry, 'lastSerialNumberEntry');
    

    if (lastSerialNumberEntry) {
        // Destructure the last entry object
        const { id, serialnumber } = lastSerialNumberEntry

        // Return the destructured object for further manipulation
        return { id, serialnumber };
    } else {
        const number = 0
        console.log(number, 'serialnumber');
        
        // If no serial numbers exist, you might want to return a new serial number or handle it as needed 
        const { serialnumber, id } = await prisma.affiliateNumberGenerator.create({
            data: {
                serialnumber: number
            }
        })

        console.log(serialnumber, 'created serial number');
        

        return { serialnumber, id };  // or return a new serial number
    }
}
