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
  text: string;
  price: string;
  duration: string;
  isWithdrawn: boolean;
  isAccepted: boolean;
  isRejected: boolean;
}

interface extendDeliveryTimeT {
  days: string;
  explainWhyExtend: string;
  extendType: string;
  isAccepted: boolean;
  isRejected: boolean;
  isPending: boolean;
  amount?: number;
}

interface cancelProjectT {
  explainWhyCancel: string,
  isAccepted: boolean,
  isRejected: boolean,
  isWithdrawn: boolean,
  extendType: string
}



interface deliverProjectT {
  isRevision: boolean;
  isAccepted: boolean;
  thumbnailImage: { watermark?: string };
  attachments: Array<object>;
}

export type {
  additionalOfferT,
  customOfferT,
  deliverProjectT,
  extendDeliveryTimeT,
  cancelProjectT
};
