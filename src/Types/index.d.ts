import { Socket } from 'socket.io';
import { JwtPayload } from 'jsonwebtoken';

export interface CustomSocket extends Socket {
    user?: JwtPayload; // Assuming JwtPayload is the type for your user data
}
