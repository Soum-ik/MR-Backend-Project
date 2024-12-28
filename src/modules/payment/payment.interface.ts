interface customOfferT {
    thumbnail: string;
    title: string;
    deliveryCount: string;
    price: string;
    desc: string;
    isAccepted: boolean;
    isRejected: boolean;
    isWithdrawn: boolean;
    requirements: string[];
}

interface additionalOfferT {
    text: string
    price: string;
    duration: string;
    isWithdrawn: boolean;
    isAccepted: boolean;
    isRejected: boolean;
}

interface extendDeliveryTimeT {
    days: number;
    explainWhyExtend: string;
    extendType: string;
    isAccepted: boolean;
    isRejected: boolean;
    amount?: number;
}



interface deliverProjectT {
    isRevision: boolean;
    isAccepted: boolean;
    thumbnailImage: { watermarkUrl?: string };
    attachments: Array<object>;
}


export type { extendDeliveryTimeT, additionalOfferT, customOfferT, deliverProjectT };