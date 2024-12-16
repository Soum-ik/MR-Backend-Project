import { affiliateSerialGenerator } from '../../../helper/SerialCodeGenerator/serialGenerator';
import { prisma } from '../../../libs/prismaHelper';

const affiliateNumberCreator = async (userId: string): Promise<string> => {
  // Fetch the user's current serial counter or initialize it
  let userSerial = await prisma.affiliateNumberGenerator.findUnique({
    where: { userId },
  });

  if (!userSerial) {
    // Initialize the counter for this user
    userSerial = await prisma.affiliateNumberGenerator.create({
      data: {
        userId,
        serialnumber: 0, // Start from 0
      },
    });
  }

  // Increment the serial number
  const newSerialNumber = (userSerial.serialnumber as number) + 1;

  // Update the serial counter in the database
  await prisma.affiliateNumberGenerator.update({
    where: { userId },
    data: { serialnumber: newSerialNumber },
  });

  // Generate the affiliate code using the custom mapping logic
  const affiliateCode = affiliateSerialGenerator(newSerialNumber);

  return affiliateCode;
};

export default affiliateNumberCreator;
