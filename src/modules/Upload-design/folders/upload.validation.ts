import { z } from "zod";

export const uploadDesignSchema = z.object({
    title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
    description: z.string().min(10, "Description must be at least 10 characters long").max(1000, "Description must be less than 1000 characters"),
    size: z.string().min(1, "Size is required").regex(/^[0-9]+x[0-9]+$/, "Size must be in the format 'widthxheight'"),
    fileFormat: z.string(),
    image: z.object({
        url: z.string().url("Image must be a valid URL"),
        name: z.string()
    }).optional(),
    tags: z.array(z.string().max(50, "Tags must be less than 30 characters")).optional(),
    folder: z.string().min(1, "Folder is required"),
    subFolder: z.string().min(1, "SubFolder is required"),
    industrie: z.string().min(1, "Industry is required"),
    design: z.string().min(1, "Design is required"),
});

