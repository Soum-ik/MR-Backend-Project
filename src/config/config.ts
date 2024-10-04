require('dotenv').config();

export const MONGODB_CONNECTION = "mongodb+srv://soum-ik:frontenddev@cluster0.dunrodk.mongodb.net/bookSelling?retryWrites=true&w=majority&appName=Cluster0";

export const JWT_SECRET = "5EC7CEFA1BE7C9354A639369A2AA8";
export const JWT_EXPIRATION_TIME = 30 * 24 * 60 * 60; // 30 Days


export const EMAIL_HOST = "sarkarsoumik215@gmail.com";
export const EMAIL_USER = "sarkarsoumik215@gmail.com";
export const EMAIL_PASSWORD = "unyn oiqq kavj awzj";

export const MAX_JSON_SIZE = "50mb";
export const URL_ENCODED = true;

export const REQUEST_LIMIT_TIME = 15 * 60 * 1000; // 15 Min
export const REQUEST_LIMIT_NUMBER = 3000; // Per 15 Min 3000 Request Allowed

export const WEB_CACHE = false;

export const PORT = 3000;
export const RESEND_API_KEY = "re_R83HxEnd_Am5p3SgxLfQWcYTACs3AgqFg"
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
