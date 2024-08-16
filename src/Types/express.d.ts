// src/typings/express.d.ts (or wherever your typings folder is located)
import { JwtPayload } from 'jsonwebtoken';

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload; // Define your custom property and its type here
        }
    }
}