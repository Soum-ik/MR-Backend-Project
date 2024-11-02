import { SendEmailCommand, SESClient, VerifyEmailIdentityCommand, } from '@aws-sdk/client-ses';
import { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } from '../../config/config';
import AppError from '../../errors/AppError';

const sesClient = new SESClient({
    region: AWS_REGION,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID as string,
        secretAccessKey: AWS_SECRET_ACCESS_KEY as string,
    },
});
const verifyEmailIdentity = async (email: string) => {
    try {
        const command = new VerifyEmailIdentityCommand({
            EmailAddress: email,
        });
        return await sesClient.send(command);
    } catch (error) {
        throw new AppError(500, 'Failed to verify email identity');
    }
};



// Email sending function
const sendEmail = async (email: string, subject: string, body: string) => {
    const command = new SendEmailCommand({
        Source: 'mrproject321@gmail.com', // Ensure this email is verified in SES
        Destination: {
            ToAddresses: [email],
        },
        Message: {
            Subject: { Data: subject },
            Body: {
                Text: { Data: body },
            },
        },
    });

    console.log(command, 'command');

    try {
        const response = await sesClient.send(command);
        return response;
    } catch (error) {
        console.error("AWS SES Error:", error); // Log detailed error information
        throw new AppError(500, "Failed to send email");
    }
};

export const AWS_SES = {
    verifyEmailIdentity,
    sendEmail,
};
