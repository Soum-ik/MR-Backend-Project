import { z } from 'zod';

export const uploadDesignSchema = z.object({
    title: z.string().nonempty("Title is required"),
    description: z.string().nonempty("Description is required"),
    size: z.string().nonempty("Size is required"),
    category: z.string().nonempty("Category is required"),
    subCategory: z.string().nonempty("SubCategory is required"),
    fileFormat: z.string().nonempty("FileFormat is required"),
    images: z.array(
        z.object({
            name: z.string().nonempty("Name is required"),
            url: z.string().url("Invalid URL format"),
            thumbnail: z.boolean().default(false),
        })
    ).nonempty("At least one image is required"),
    tags: z.array(z.string()).nonempty("At least one tag is required"),
    folder: z.string().nonempty("Folder is required"),
    subFolder: z.string().nonempty("SubFolder is required"),
    industries: z.array(z.string()),
    designs: z.array(z.string()),
    relatedDesigns: z.array(z.string()).nonempty("At least one related design is required"),
   
});
