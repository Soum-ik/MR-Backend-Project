import { affiliateSerialGenerator } from "../../../helper/SerialCodeGenerator/serialGenerator";
import { prisma } from "../../../libs/prismaHelper";
import { getLastAffiliateSerialNumber } from "../../../libs/utlitys/affiliate";



const affiliateNumberCreator = async () => {

    // Get the last serial number from the server
    const { serialnumber } = await getLastAffiliateSerialNumber();

    const convertStringIntoNumber = serialnumber && parseInt(serialnumber);

    let specialSerialCodeGenarator;
    let convertedSerialUpdateNumber;

    if (convertStringIntoNumber) {
        convertedSerialUpdateNumber = convertStringIntoNumber + 1;
        specialSerialCodeGenarator = affiliateSerialGenerator(convertedSerialUpdateNumber);
    }

    await prisma.affiliateNumberGenerator.create({
        data: {
            serialnumber: convertedSerialUpdateNumber + ''
        }
    })

    return specialSerialCodeGenarator
}


export default affiliateNumberCreator