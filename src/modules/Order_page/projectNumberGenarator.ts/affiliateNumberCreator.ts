import { affiliateSerialGenerator } from "../../../helper/SerialCodeGenerator/serialGenerator";
import { prisma } from "../../../libs/prismaHelper";
import { getLastAffiliateSerialNumber } from "../../../libs/utlitys/affiliate";



const affiliateNumberCreator = async () => {

    // Get the last serial number from the server
    const { serialnumber } = await getLastAffiliateSerialNumber();



    let specialSerialCodeGenarator;
    let convertedSerialUpdateNumber;

    if (serialnumber !== null) {
        convertedSerialUpdateNumber = serialnumber + 1;
        specialSerialCodeGenarator = affiliateSerialGenerator(convertedSerialUpdateNumber);
    }

    await prisma.affiliateNumberGenerator.create({
        data: {
            serialnumber: convertedSerialUpdateNumber
        }
    })

    return specialSerialCodeGenarator
}
 

export default affiliateNumberCreator