import { Socket } from 'socket.io';
import socketStore from '../socket-store';

const disconnectHandler = (socket: Socket) => {
    socketStore.removeConnectedUser(socket.id);
};

export default disconnectHandler;
