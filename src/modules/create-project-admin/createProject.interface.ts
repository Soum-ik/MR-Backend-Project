export interface CreateProject {
    id: string; // ObjectId type in Prisma
    projectImage?: string;
    originalAmount?: number;
    offerAmount?: number;
    extraFastDelivery?: number;
    extraFastDeliveryAmount?: number;
    providedSource?: string[];
    requirement?: string[];

    userId: string; // User relationship field


    designId?: string; // Design relationship field
}