import httpStatus from 'http-status';
import nodemailer, { SendMailOptions } from 'nodemailer';
import { EMAIL_USER, EMAIL_PASSWORD } from '../../config/config';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { print } from '../colorConsolePrint.ts/colorizedConsole';
import AppError from '../../errors/AppError';

export const sendMail = async (options: SendMailOptions) => {
    try {
        const nodeMailerOptions: SMTPTransport | SMTPTransport.Options | string = {
            service: "gmail",
            auth: {
                user: EMAIL_USER,
                pass: EMAIL_PASSWORD,
            },
        };

        // 1. create transporter
        const transporter = nodemailer.createTransport(nodeMailerOptions);
        console.log(transporter, 'checking transporter');


        // 2. define email options
        const mailOptions = {
            from: EMAIL_USER,
            ...options,
        };

        // 3. send email
        await transporter.sendMail(mailOptions);
    } catch (error) {
        print.red('err', error);
        throw new AppError(
            httpStatus.INTERNAL_SERVER_ERROR,
            'There was an error sending the email. Try again later!',
        );
    }
};
