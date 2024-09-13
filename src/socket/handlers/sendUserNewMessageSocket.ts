
import { socketEvents } from '../../constants/socketEvent';
import socketStore from '../socket-store';

const sendUserNewMessageSocket = async (
    userId: number,
    msg: Messages,
) => {
    const onlineConnections = socketStore.getActiveConnections(userId);
    const socket = socketStore.getSocketServerInstance();
    if (onlineConnections.length > 0) {
        socket.to(onlineConnections).emit(socketEvents.userNewMessage, msg);
    }
};

export default sendUserNewMessageSocket;
