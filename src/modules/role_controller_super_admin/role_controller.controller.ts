import { Request, Response } from "express";
import httpStatus from "http-status";
import { prisma } from "../../libs/prismaHelper";
import sendResponse from "../../libs/sendResponse";

const manage_role = async (req: Request, res: Response) => {
  try {
    const { user_id, role, users } = req.body;

    // If users array is provided, handle multiple role updates
    if (users && Array.isArray(users) && users.length > 0) {
      const results = [];

      for (const { user_id, role } of users) {
        const findUser = await prisma.user.findUnique({
          where: { id: user_id },
        });

        if (!findUser) {
          results.push({
            user_id,
            success: false,
            message: "User not found",
          });
          continue;
        }

        const updatedUser = await prisma.user.update({
          where: { id: user_id },
          data: { role },
        });

        results.push({
          user_id: updatedUser.id,
          success: true,
          message: `Role updated to ${updatedUser.role}`,
          fullName: updatedUser.fullName,
          email: updatedUser.email,
        });
      }

      return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Role updates processed",
        data: results,
      });
    }

    // If single user data is provided, handle a single role update
    if (user_id && role) {
      const findUser = await prisma.user.findUnique({
        where: { id: user_id },
      });

      if (!findUser) {
        return sendResponse(res, {
          statusCode: httpStatus.NOT_FOUND,
          success: false,
          message: "User not found",
        });
      }

      const updatedUser = await prisma.user.update({
        where: { id: user_id },
        data: { role },
      });

      return sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: `User role updated successfully. User details: Name: ${updatedUser.fullName}, Email: ${updatedUser.email}, ID: ${updatedUser.id}, Role: ${updatedUser.role}`,
        data: null,
      });
    }

    // If neither users array nor single user_id/role is provided
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "Invalid input, please provide either 'user_id' and 'role' or 'users' array",
    });
  } catch (error) {
    return sendResponse(res, {
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      success: false,
      message: "Error updating user role",
    });
  }
};

export const manage_role_controller = {
  manage_role,
};
