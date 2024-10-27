import { Request, Response } from "express";
import Stripe from "stripe";
import { STRIPE_SECRET_KEY } from "../../config/config";
import { prisma } from "../../libs/prismaHelper";

const stripe = new Stripe(STRIPE_SECRET_KEY as string);

// Utility function to generate a unique project number (example)
const generateUniqueProjectNumber = (): string => {
    return `PROJ-${Math.floor(100000 + Math.random() * 900000)}`;
};

// Utility function to calculate delivery date
const calculateDeliveryDate = (duration: number): Date => {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + duration);
    return deliveryDate;
};

const stripeWebhook = async (req: Request, res: Response) => {
    let event = req.body;
    // try {
    //     event = stripe.webhooks.constructEvent(
    //         req.body,
    //         sig,
    //         "whsec_1b45b1e0b2fe103a4a09e4f70e00a4d5cba39ea51a8f126b5486f03466a646c3"
    //     );
    //     console.log("iseventrunning ❗", event);
    // } catch (error: any) {
    //     console.error("Webhook signature verification failed:", error.message);
    //     return res.status(400).send(`Webhook Error: ${error.message}`);
    // }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('session',session);
        

        try {
            const lineItems = await stripe.checkout.sessions.listLineItems(
                session.id
            );
            const items = lineItems.data.map((item) => ({
                name: item.description, // Get the product name
                quantity: item.quantity,
                amount: item.amount_total / 100, // Amount in dollars
                currency: item.currency,
            }));
            // Save payment info in the database
            const payment = await prisma.payment.create({
                data: {
                    stripeId: session.id,
                    status: session.payment_status,
                    amount: session.amount_total! / 100,
                    currency: session.currency as string,
                    items: items, // Adjust based on actual items
                    userId: "671bc9cf33725a2b3bc22b5a" as string,
                },
            });

            console.log("payment", payment);

            console.log("Payment successfully recorded in the database.");

            // Create an order linked to the payment and user
            // const order = await prisma.order.create({
            //     data: {
            //         userId: "user_id" as string,
            //         projectName: "Sample Project", // Replace with actual project name
            //         projectNumber: generateUniqueProjectNumber(), // Utility function to generate a unique number
            //         quantity: "1", // Modify based on your context
            //         duration: "30", // Modify based on your context
            //         totalPrice: (session.amount_total! / 100).toString(), // Example assuming amount_total is in cents
            //         paymentStatus: "COMPLETED",
            //         startDate: new Date(),
            //         deliveryDate: calculateDeliveryDate(30), // Utility function to set delivery date based on duration
            //         currentStatus: "PLACED",
            //     },
            // });
            // console.log("order", order);
            // console.log("Order successfully created with status 'PLACED'.");
        } catch (error) {
            console.error("Error updating status:", error);
        }
    }

    res.json({ received: true });
};

export { stripeWebhook };
