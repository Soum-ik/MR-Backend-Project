import type { Request } from "express";
import Stripe from "stripe";
import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } from "../../config/config";
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

const stripePayment = async (req: Request, res: any) => {
    const { data } = req.body; // Array of items for the checkout session
    console.log("data", data);

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: data.items.map((item: any) => ({
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
            success_url: "http://localhost:5173",
            cancel_url: "http://localhost:5173/cancel",
        });
        res.json({ id: session.id });
    } catch (error) {
        console.error("Error creating checkout session:", error);
        res.status(500).send("Internal Server Error");
    }
};

const stripeWebhook = async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET as string);
    } catch (error : any) {
        console.error("Webhook signature verification failed:", error.message);
        return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;

        try {
            const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
            const items = lineItems.data.map(item => ({
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
                    userId: "Tesingg......." as string,
                },
            });

            console.log("Payment successfully recorded in the database.");

            // Create an order linked to the payment and user
            const order = await prisma.order.create({
                data: {
                    userId: "user_id" as string,
                    projectName: "Sample Project", // Replace with actual project name
                    projectNumber: generateUniqueProjectNumber(), // Utility function to generate a unique number
                    quantity: "1", // Modify based on your context
                    duration: "30", // Modify based on your context
                    totalPrice: (session.amount_total! / 100).toString(), // Example assuming amount_total is in cents
                    paymentStatus: "COMPLETED",
                    startDate: new Date(),
                    deliveryDate: calculateDeliveryDate(30), // Utility function to set delivery date based on duration
                    currentStatus: "PLACED",
                },
            });

            console.log("Order successfully created with status 'PLACED'.");

        } catch (error) {
            console.error("Error updating order status:", error);
        }
    }

    res.json({ received: true });
};


export const payment = { stripePayment, stripeWebhook };
