import nodemailer from "nodemailer";
import { emailTemplate } from "./emailTemplate";
import { EMAIL_HOST, EMAIL_PASSWORD } from "../../config/config";

interface EmailCredentials {
    receiver: string; // Corrected the typo from "revicer" to "receiver"
    image?: string;
    name: string;
    subject: string;
    code: number;
}

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: EMAIL_HOST,
        pass: EMAIL_PASSWORD,
    },
});

const sendVeficationEmail = async (data: EmailCredentials) => {
    const mailOptions = {
        from: EMAIL_HOST,
        to: data.receiver,
        subject: data.subject,
        html: emailTemplate({
            name: data.name, code: data.code,
        }), // Generate HTML content
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        return info
    } catch (error) {
        console.log("Error sending email:", error);
    }

};

export default sendVeficationEmail;