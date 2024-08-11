

interface TemplateCredentials {
    name: String,
    code: Number
}

export const emailTemplate = (data: TemplateCredentials) => {

    return `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Sign-Up Confirmation</title>
     <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
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
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        h2 {
            color: #333;
            text-align: center;
        }
        p {
            color: #555;
            font-size: 16px;
            text-align: center;
            margin-bottom: 20px;
        }
        .verification-code {
            font-size: 24px;
            text-align: center;
            margin: 20px 0;
            padding: 10px;
            background-color: #f0f0f0;
            border: 1px solid #ccc;
            border-radius: 5px;
        }
        .cta-button {
            display: block;
            width: 100%;
            max-width: 200px;
            margin: 20px auto;
            padding: 10px;
            text-align: center;
            color: #fff;
            background-color: #007bff;
            text-decoration: none;
            border-radius: 5px;
        }
        .cta-button:hover {
            background-color: #0056b3;
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

        <h1> Welcome ${data.name}. Thank you for comming</h1>
        <h2>Confirm Your Email</h2>
        <p>Thank you for signing up! Please use the verification code below to activate your account. This Verification code will be active next 1 hours.</p>
        <div class="verification-code">
            <!-- Replace this text with the actual verification code dynamically generated in your application -->
           ${data.code}
        </div>
        <a href="#" class="cta-button">Verify Email</a>
        <p>If you did not sign up for this service, please ignore this email.</p>
    </div>
</body>
</html>

    `;
};