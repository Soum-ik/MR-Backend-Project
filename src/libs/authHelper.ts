import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRATION_TIME } from '../config/config';

export interface TokenCredential {
    user_id: string
    role: string
    email: string
}

export const createToken = ({ user_id, role, email }: TokenCredential) => {
    const payload = { user_id, role, email };
    const options = { expiresIn: JWT_EXPIRATION_TIME };
    try {
        const token = jwt.sign(payload, JWT_SECRET, options);
        return token;
    } catch (error) {
        console.error('Token not created:', error);
    }
};

export const verifyToken = (token: string) => {
    try {
        const trimmedToken = token.replace(/^"|"$/g, '');
        const decoded = jwt.verify(trimmedToken, JWT_SECRET);
        return decoded;
    } catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
};