import { ObjectId } from "bson";
import type { Request } from "express";
import Stripe from "stripe";
import { STRIPE_SECRET_KEY } from "../../config/config";
import { prisma } from "../../libs/prismaHelper";
import projectNumberCreator from "../Order_page/projectNumberGenarator.ts/projectNumberCreator";

const stripe = new Stripe(STRIPE_SECRET_KEY as string);

// Utility function to calculate delivery date
const calculateDeliveryDate = (duration: number): Date => {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + duration);
    return deliveryDate;
};

const orderId = new ObjectId();

const stripePayment = async (req: Request, res: any) => {
    const projectNumber = await projectNumberCreator()

    const { data } = req.body;
    console.log("data showing:", data);

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: data?.items.map((item: any) => ({
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

        // Save payment info in the database
        const payment = await prisma.payment.create({
            data: {
                userId: data?.userId,
                stripeId: session.id.split("_").join(""),
                status: "PENDING",
                amount: data?.totalAmount.toString(),
                currency: session.currency as string,
                orderId: orderId.toString(),
            },
        });

        console.log("Payment successfully recorded in the database.");

        // Create an order linked to the payment and user
        const order = await prisma.order.create({
            data: {
                id: orderId.toString(),
                stripeId: session.id.split("_").join(""),
                userId: data?.userId,
                projectName: data?.title,
                projectNumber: projectNumber || "",
                items: data?.items,
                duration: data?.deliveryDuration.toString(),
                totalPrice: data?.totalAmount.toString(),
                paymentStatus: "PENDING",
                startDate: new Date(),
                deliveryDate: calculateDeliveryDate(data?.deliveryDuration),
                currentStatus: "PENDING",
                requirements: data?.requirements,
                bulletPoints: data?.bulletPoints,
            },
        });


        console.log("Order successfully created with status 'PLACED'.");

        res.json({ id: session.id });
    } catch (error) {
        console.error("Error creating checkout session:", error);
        res.status(500).send("Internal Server Error");
    }
};

export const payment = { stripePayment };
