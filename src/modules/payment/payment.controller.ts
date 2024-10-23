import { Request, Response } from "express";
import Stripe from "stripe";
import { prisma } from "../../libs/prismaHelper";
import sendResponse from "../../libs/sendResponse";
import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } from "../../config/config";
import { TokenCredential } from "../../libs/authHelper";

const stripe = new Stripe(STRIPE_SECRET_KEY as string);

export const handleWebhook = async (req: Request, res: Response) => {
    const { email, role, user_id } = req.user as TokenCredential;
    const sig = req.headers['stripe-signature'];
    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig as string, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error(`⚠️ Webhook signature verification failed.`, err.message);
        return res.sendStatus(400);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;

        try {
            // Save payment info in the database
            await prisma.payment.create({
                data: {
                    stripeId: session.id,
                    status: session.payment_status,
                    amount: session.amount_total!,
                    currency: session.currency as string,
                    items: ''  ,
                    userId: user_id as string,
                },
            });

            console.log("Payment successfully recorded in the database.");
        } catch (err) {
            console.error("Failed to store payment info in the database.", err);
            return res.status(500).send("Server Error");
        }
    }

    // Respond with 200 to acknowledge receipt of the event
    res.json({ received: true });
};
