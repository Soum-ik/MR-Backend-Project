import { NotificationType } from "../../constants/Notification";

export interface inboxUpdatePayload {
    senderId: string;
    type: NotificationType;
    projectNumber: string;
    recipientId: string;
}
