import type { Request } from "express";
import Stripe from "stripe";
import { STRIPE_SECRET_KEY } from "../../config/config";

const stripe = new Stripe(STRIPE_SECRET_KEY);

const stripePayment = async (req: Request, res: any) => {
  const { items } = req.body; // Array of items for the checkout session
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            images: [item.image], // Optional
          },
          unit_amount: item.price * 100, // Price in cents
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `http://localhost:5173/success`,
      cancel_url: `http://localhost:5173/cancel`,
    });
    res.json({ id: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).send('Internal Server Error');
  }
};

export const payment = { stripePayment };
