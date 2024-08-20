import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { prisma } from '../../libs/prismaHelper';
import sendResponse from '../../libs/sendResponse';
import { z } from 'zod';
import { categorySchema, subCategorySchema } from './CategoryValidation';
import { Prisma } from '@prisma/client';
// Assuming you have the Zod schemas already defined


// Define a combined schema for Category with embedded subCategories
const categoryWithSubCategorySchema = categorySchema.extend({
    subCategory: z.array(subCategorySchema),
});

const createCategoryWithSubCategory = async (req: Request, res: Response) => {


    try {
        // Validate request body against the combined schema
        const validatedData = categoryWithSubCategorySchema.parse(req.body);
        console.log(validatedData, 'validation data');

        // If validation passes, create the category and subCategories using Prisma
        const newCategory = await prisma.category.create({
            data: {
                categoryName: validatedData.categoryName,
                image: validatedData.image,
                bulletPoint: validatedData.bulletPoint,
                requirements: validatedData.requirements,
                subCategory: {
                    create: validatedData.subCategory, // Create associated subCategories
                },
            },
            include: { subCategory: true }, // Include subCategory in the response
        });

        // Send success response
        return sendResponse<any>(res, { statusCode: httpStatus.OK, success: true, message: 'Category and SubCategories created successfully', data: newCategory })
    } catch (error) {
        console.log(error);

        if (error instanceof z.ZodError) {
            return sendResponse<any>(res, { statusCode: httpStatus.BAD_GATEWAY, success: false, message: 'Validation error', data: error })
        }

        return sendResponse<any>(res, { statusCode: httpStatus.INTERNAL_SERVER_ERROR, success: false, message: 'An unexpected error occurred', data: error })
    }
};

const getAllCategories = async (req: Request, res: Response) => {
    try {
        // Fetch all categories and include their associated subCategories
        const categories = await prisma.category.findMany({
            include: {
                subCategory: true, // Include subCategory records
            },
        });

        // Send the response with the retrieved categories
        return sendResponse<any>(res, { statusCode: httpStatus.OK, success: true, message: 'Category and SubCategories created successfully', data: categories })
    } catch (error) {
        // Handle potential errors
        return sendResponse<any>(res, { statusCode: httpStatus.INTERNAL_SERVER_ERROR, success: false, message: 'An error occurred while retrieving categories', data: error });
    }
};


const deleteCategoriesById = async (req: Request, res: Response) => {
    try {
        // Extract the category ID from the request parameters
        const { id } = req.params;

        // Validate the ObjectId format
        if (!id) {
            return sendResponse<any>(res, {
                statusCode: httpStatus.BAD_REQUEST,
                success: false,
                message: 'Invalid category ID format',
                data: null,
            });
        }

        // Attempt to delete the category by its ID
        const deletedCategory = await prisma.category.delete({
            where: { id },
        });

        // If the category is successfully deleted, send a success response
        return sendResponse<any>(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: 'Category deleted successfully',
            data: deletedCategory,
        });
    } catch (error: any) {
        // Check if the error is related to the category not being found
        if (error.code === 'P2025') {
            return sendResponse<any>(res, {
                statusCode: httpStatus.NOT_FOUND,
                success: false,
                message: 'Category not found',
                data: null,
            });
        }

        // Handle any other server errors
        return sendResponse<any>(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            message: 'An error occurred while deleting the category',
            data: error.message,
            success: false,
        });
    }
};


export const Category = {
    createCategoryWithSubCategory, getAllCategories, deleteCategoriesById
}