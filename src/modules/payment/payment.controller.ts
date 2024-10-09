import type { Request } from "express";
import Stripe from "stripe";
import { STRIPE_SECRET_KEY } from "../../config/config";

const stripe = new Stripe(STRIPE_SECRET_KEY as string);

const stripePayment = async (req: Request, res: any) => {
    const { data } = req.body; // Array of items for the checkout session
    console.log("data", data);

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: data.items.map((item : any) => ({
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: item?.name,
                        images: item?.image, // Optional
                    },
                    unit_amount: item.isFastDelivery
                        ? (item.baseAmount + item.fastDeliveryPrice) * 100
                        : item.baseAmount * 100,
                },
                quantity: item.quantity,
            })),
            mode: "payment",
            success_url: `http://localhost:5173/success`,
            cancel_url: `http://localhost:5173/cancel`,
        });
        res.json({ id: session.id });
    } catch (error) {
        console.error("Error creating checkout session:", error);
        res.status(500).send("Internal Server Error");
    }
};

export const payment = { stripePayment };
