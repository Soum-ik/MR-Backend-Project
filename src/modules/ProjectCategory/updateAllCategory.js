import { prisma } from '../../libs/prismaHelper';

import { Request, Response } from "express";
import httpStatus from "http-status";
import { z } from "zod";
import { prisma } from "../../libs/prismaHelper";
import sendResponse from "../../libs/sendResponse";


export default async function updateAllCategory(req, res) {
  if (req.method === "POST") {
    const { newOrder } = req.body; // newOrder should be an array of items with their new positions
    console.log(newOrder);
    try {
      // Start a transaction to update multiple records
      await prisma.$transaction(
        newOrder.map((item, index) =>
          prisma.category.update({
            where: { id: item.id },
            data: { order: index },
          })
        )
      );
      res.status(200).send("Order updated successfully");
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).send("Error updating order");
    }
  } else {
    res.status(405).send("Method not allowed");
  }
}
