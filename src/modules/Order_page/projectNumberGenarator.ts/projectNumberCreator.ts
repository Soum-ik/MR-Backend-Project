import { getLastSerialNumber } from "../../../libs/utlitys/projectNumber";

export const projectNumberCreator = async () => {


    // Get the last serial number from the server
    const { serialnumber } = await getLastSerialNumber();

    const convertStringIntoNumber = serialnumber && parseInt(serialnumber);

    let specialSerialCodeGenarator;
    let convertedSerialUpdateNumber;

    if (convertStringIntoNumber) {
        convertedSerialUpdateNumber = convertStringIntoNumber + 1;
        specialSerialCodeGenarator = designSerialGenerator(convertedSerialUpdateNumber);
    }

    await prisma.desigserialNumberGenerator.create({
        data: {
            serialnumber: convertedSerialUpdateNumber + ''
        }
    })
}
