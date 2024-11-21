import { Request, Response } from 'express';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '../../config/config';
import { prisma } from '../../libs/prismaHelper';
import { OrderStatus, ProjectStatus } from '../Order_page/Order_page.constant';
import { PaymentStatus } from './payment.constant';

const stripe = new Stripe(STRIPE_SECRET_KEY as string);

const stripeWebhook = async (req: Request, res: Response) => {
  const event = req.body;
  console.log('all event', event);

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
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('session', session);

      if (session?.metadata?.paymentType === 'Additional Offer') {
        // Handle additional packages
        console.log('Additional Offer payment completed:', session);
      } else if (session?.metadata?.paymentType === 'Extend Delivery') {
        // Handle design order payment
        console.log('Tips payment completed:', session);
      }

      try {
        // Save payment info in the database
        await prisma.payment.update({
          where: { stripeId: session.id.split('_').join('') },
          data: { status: PaymentStatus.PAID },
        });

        console.log('Payment successfully updated in the database.');

        // Create an order linked to the payment and user
        const order = await prisma.order.update({
          where: { stripeId: session.id.split('_').join('') },
          data: {
            trackProjectStatus: OrderStatus.PROJECT_PLACED,
            projectStatus: ProjectStatus.WAITING,
            paymentStatus: PaymentStatus.PAID,
          },
        });

        console.log('order', order);
        console.log("Order successfully updated with status 'PLACED'.");
      } catch (error) {
        console.error('Error updating status:', error);
      }
      break;
    }

    // Handle other event types here
    // case "checkout.session.async_payment_failed": {
    //     const session = event.data.object as Stripe.Checkout.Session;
    //     console.log("session", session);

    //     try {
    //         await prisma.payment.delete({
    //             where: { stripeId: session.id.split('_').join("") },
    //         });

    //         console.log("Payment deleted cause payment failed!");

    //         await prisma.order.delete({
    //             where: { stripeId: session.id.split('_').join("") },
    //         });

    //         console.log("Order deleted cause payment failed!");
    //     } catch (error) {
    //         console.error("Error updating status:", error);
    //     }
    //     break;
    // }

    // case "payment_intent.canceled": {
    //     const session = event.data.object as Stripe.Checkout.Session;
    //     console.log("session", session);

    //     try {
    //         await prisma.payment.delete({
    //             where: { stripeId: session.id.split('_').join("") },
    //         });

    //         console.log("Payment deleted cause payment failed!");

    //         await prisma.order.delete({
    //             where: { stripeId: session.id.split('_').join("") },
    //         });

    //         console.log("Order deleted cause payment failed!");
    //     } catch (error) {
    //         console.error("Error updating status:", error);
    //     }
    //     break;
    // }

    // case "payment_intent.payment_failed": {
    //     const session = event.data.object as Stripe.Checkout.Session;
    //     console.log("session", session);

    //     try {
    //         await prisma.payment.delete({
    //             where: { stripeId: session.id.split('_').join("") },
    //         });

    //         console.log("Payment deleted cause payment failed!");

    //         await prisma.order.delete({
    //             where: { stripeId: session.id.split('_').join("") },
    //         });

    //         console.log("Order deleted cause payment failed!");
    //     } catch (error) {
    //         console.error("Error updating status:", error);
    //     }
    //     break;
    // }
  }

  res.json({ received: true });
};

export { stripeWebhook };
