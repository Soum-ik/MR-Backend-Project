import { projectSerialGenerator } from "../../../helper/SerialCodeGenerator/serialGenerator";
import { prisma } from "../../../libs/prismaHelper";
import { getLastSerialNumber } from "../../../libs/utlitys/projectNumber";


const projectNumberCreator = async () => {

    // Get the last serial number from the server
    const { serialnumber } = await getLastSerialNumber();

    const convertStringIntoNumber = serialnumber && parseInt(serialnumber);

    let specialSerialCodeGenarator;
    let convertedSerialUpdateNumber;

    if (convertStringIntoNumber) {
        convertedSerialUpdateNumber = convertStringIntoNumber + 1;
        specialSerialCodeGenarator = projectSerialGenerator(convertedSerialUpdateNumber);
    }

    await prisma.projectSerialNumberGenerator.create({
        data: {
            serialnumber: convertedSerialUpdateNumber + ''
        }
    })

    return specialSerialCodeGenarator
}


export default projectNumberCreator