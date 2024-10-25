import { Request, Response } from "express";
import Stripe from "stripe";
import { prisma } from "../../libs/prismaHelper";
import sendResponse from "../../libs/sendResponse";
import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } from "../../config/config";
import { TokenCredential } from "../../libs/authHelper";
import { projectSerialGenerator } from "../../helper/SerialCodeGenerator/serialGenerator";


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

        const projectNumber = projectSerialGenerator();

        try {
            // Save payment info in the database
            const payment = await prisma.payment.create({
                data: {
                    stripeId: session.id,
                    status: session.payment_status,
                    amount: session.amount_total!,
                    currency: session.currency as string,
                    items: '', // Adjust based on actual items
                    userId: user_id as string,
                },
            });

            console.log("Payment successfully recorded in the database.");

            // Create an order linked to the payment and user
            const order = await prisma.order.create({
                data: {
                    userId: user_id as string,
                    projectName: "Sample Project",  // Replace with actual project name
                    projectNumber: generateUniqueProjectNumber(),  // Utility function to generate a unique number
                    quantity: "1",  // Modify based on your context
                    duration: "30",  // Modify based on your context
                    totalPrice: (session.amount_total! / 100).toString(),  // Example assuming amount_total is in cents
                    paymentStatus: "COMPLETED",
                    startDate: new Date(),
                    deliveryDate: calculateDeliveryDate(30),  // Utility function to set delivery date based on duration
                    currentStatus: "PLACED",
                },
            });

            console.log("Order successfully created with status 'PLACED'.");

        } catch (err) {
            console.error("Failed to process payment and create order in the database.", err);
            return res.status(500).send("Server Error");
        }
    }

    // Respond with 200 to acknowledge receipt of the event
    res.json({ received: true });
};

// Utility function to calculate delivery date
const calculateDeliveryDate = (duration: number): Date => {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + duration);
    return deliveryDate;
};

// Utility function to generate a unique project number (example)
const generateUniqueProjectNumber = (): string => {
    return `PROJ-${Math.floor(100000 + Math.random() * 900000)}`;
};
