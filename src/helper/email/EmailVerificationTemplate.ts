interface TemplateCredentials {
    name: String;
    code: Number;
}

export const emailVerficationTemplate = (data: TemplateCredentials) => {
    return `
    <!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Email Sign-Up Confirmation</title>
        <style>
            * {
                margin: 0;
            }
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 20px auto;
                padding: 20px;
                background-color: #fff;
                border-radius: 8px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            .logo-box {
                margin-top: 15px;
                display: flex;
                justify-content: center;
            }
            .logo {
                width: 80px;
                margin: 0 auto;
            }
            .title {
                color: #333;
                text-align: center;
                margin-bottom: 15px;
                margin-top: 20px;
            }

            p {
                color: #555;
                font-size: 14px;
                text-align: center;
                margin-bottom: 15px;
            }
            .verification-code {
                max-width: 400px;
                font-size: 24px;
                text-align: center;
                margin: 20px auto;
                padding: 10px;
                background-color: #f0f0f0;
                border: 1px solid #ccc;
                border-radius: 5px;
                letter-spacing: 7px;
                font-weight: 600;
            }

            /* Responsive Styles */
            @media only screen and (max-width: 600px) {
                .container {
                    padding: 10px;
                }
                .cta-button {
                    max-width: 100%;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo-box">
                <img class="logo" src=${`https://mr-backend.s3.amazonaws.com/MR+Logo+Black.png`} alt="MR Logo" />
            </div>
            <h2 class="title">Verification Code</h2>
            <p>Please use the following One Time Password (OTP)</p>
            <div class="verification-code">
                <!-- Replace this text with the actual verification code dynamically generated in your application -->
                656757
            </div>
            <p>
                If you did not sign up for this service, please ignore this
                email.
            </p>
        </div>
    </body>
</html>
`;
};
