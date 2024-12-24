import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Converts days to hours.
 * @param {string | number} days - The number of days to convert.
 * @returns {number} - The equivalent hours.
 */
function daysToHours(days: string | number): number {
  return parseInt(days as string, 10) * 24;
}

/**
 * Updates the delivery date for an order.
 * @param {string} orderId - The ID of the order to update.
 * @param {number} days - The number of days to add.
 * @returns {Promise<{ updatedDeliveryDate: Date | null, duration: number, durationHours: number }>} - The updated delivery date, total duration in days, and total duration in hours.
 */
interface OrderData {
  id: string;
  duration: string | null;
  durationHours: string | null;
  startDate: Date | null;
}

interface UpdateDeliveryDateResult {
  updatedDeliveryDate: Date | null;
  duration: number;
  durationHours: number;
}

async function updateDeliveryDate(
  orderData: OrderData,
  days: number,
): Promise<UpdateDeliveryDateResult> {
  try {
    if (!orderData) {
      throw new Error('Order not found');
    }

    const hours = daysToHours(days || '0');

    const totalDurationDays = parseInt(orderData.duration || '0', 10) + days;
    const totalDurationHours =
      parseInt(orderData.durationHours || '0', 10) + hours;

    let updatedDeliveryDate: Date | null = null;

    if (orderData.startDate) {
      updatedDeliveryDate = new Date(orderData.startDate);

      // Add hours to the delivery date
      if (orderData.durationHours) {
        updatedDeliveryDate.setHours(
          updatedDeliveryDate.getHours() + totalDurationHours,
        );
      } else {
        updatedDeliveryDate.setDate(
          updatedDeliveryDate.getDate() + totalDurationDays,
        );
      }
    }

    return {
      updatedDeliveryDate,
      duration: totalDurationDays,
      durationHours: totalDurationHours,
    };
  } catch (error) {
    console.error('Error updating delivery date:', error);
    return {
      updatedDeliveryDate: null,
      duration: 0,
      durationHours: 0,
    };
  }
}

export { updateDeliveryDate };
