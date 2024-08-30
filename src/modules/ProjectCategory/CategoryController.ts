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
        return sendResponse<any>(res, { statusCode: httpStatus.OK, success: true, message: 'Category and SubCategories get successfully', data: categories })
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
        if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
            return sendResponse<any>(res, {
                statusCode: httpStatus.BAD_REQUEST,
                success: false,
                message: 'Invalid category ID format',
                data: null,
            });
        }

        // Fetch the category to check if it exists
        const existingCategory = await prisma.category.findUnique({
            where: { id },
            include: { subCategory: true }, // Include subCategories to check if any exist
        });

        if (!existingCategory) {
            return sendResponse<any>(res, {
                statusCode: httpStatus.NOT_FOUND,
                success: false,
                message: 'Category not found',
                data: null,
            });
        }

        // If there are subCategories, delete them first
        if (existingCategory.subCategory.length > 0) {
            await prisma.subCategory.deleteMany({
                where: { categoryId: id },
            });
        }

        // Now delete the category
        const deletedCategory = await prisma.category.delete({
            where: { id },
        });

        // If the category is successfully deleted, send a success response
        return sendResponse<any>(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: 'Category and related subCategories deleted successfully',
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
            success: false,
            message: 'An error occurred while deleting the category',
            data: error.message,
        });
    }
};


const updateCategoryWithSubCategory = async (req: Request, res: Response) => {
    try {
        // Validate request body against the combined schema
        const validatedData = categoryWithSubCategorySchema.parse(req.body);

        // Fetch the existing category by ID
        const existingCategory = await prisma.category.findUnique({
            where: { id: req.params.id },
            include: { subCategory: true }, // Include subCategory in the response
        });

        if (!existingCategory) {
            return sendResponse<any>(res, {
                statusCode: httpStatus.NOT_FOUND,
                success: false,
                message: 'Category not found',
            });
        }

        // Prepare the subcategory update/create/delete operations
        const subCategoryOperations = validatedData.subCategory.map((sub) => {
            if (sub.id) {
                // Update existing subcategory
                return prisma.subCategory.update({
                    where: { id: sub.id },
                    data: {
                        subTitle: sub.subTitle,
                        subAmount: sub.subAmount,
                        regularDeliveryDays: sub.regularDeliveryDays,
                        fastDeliveryDays: sub.fastDeliveryDays,
                        fastDeliveryPrice: sub.fastDeliveryPrice,
                    },
                });
            } else {
                // Create new subcategory
                return prisma.subCategory.create({
                    data: {
                        subTitle: sub.subTitle,
                        subAmount: sub.subAmount,
                        regularDeliveryDays: sub.regularDeliveryDays,
                        fastDeliveryDays: sub.fastDeliveryDays,
                        fastDeliveryPrice: sub.fastDeliveryPrice,
                        categoryId: existingCategory.id,
                    },
                });
            }
        });

        // Execute all subcategory operations
        const updatedSubCategories = await Promise.all(subCategoryOperations);

        // Update the main category
        const updatedCategory = await prisma.category.update({
            where: { id: req.params.id },
            data: {
                categoryName: validatedData.categoryName,
                image: validatedData.image,
                bulletPoint: validatedData.bulletPoint,
                requirements: validatedData.requirements,
            },
            
        });

        // Send success response
        return sendResponse<any>(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: 'Category and SubCategories updated successfully',
            data: { ...updatedCategory, subCategory: updatedSubCategories },
        });
    } catch (error) {
        console.log(error);

        if (error instanceof z.ZodError) {
            return sendResponse<any>(res, {
                statusCode: httpStatus.BAD_GATEWAY,
                success: false,
                message: 'Validation error',
                data: error,
            });
        }

        return sendResponse<any>(res, {
            statusCode: httpStatus.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'An unexpected error occurred',
            data: error,
        });
    }
};


export const Category = {
    createCategoryWithSubCategory, getAllCategories, deleteCategoriesById, updateCategoryWithSubCategory
}