import httpStatus from 'http-status';
import nodemailer, { SendMailOptions } from 'nodemailer';
import { mailServer } from '../../config/config';





import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { print } from '../colorConsolePrint.ts/colorizedConsole';
import AppError from '../../errors/AppError';

export const sendMail = async (options: SendMailOptions) => {
    try {
        const nodeMailerOptions: SMTPTransport | SMTPTransport.Options | string = {
            host: mailServer.host,
            port: parseInt(mailServer.port),
            auth: {
                user: mailServer.auth.user,
                pass: mailServer.auth.pass,
            },
            secure: false,
            // Add these options to ignore certificate errors
            tls: {
                rejectUnauthorized: false,
            },
        };

        // 1. create transporter
        const transporter = nodemailer.createTransport(nodeMailerOptions);

        // 2. define email options
        const mailOptions = {
            from: mailServer.sendingEmail,
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
