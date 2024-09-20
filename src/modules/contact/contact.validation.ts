import { z } from "zod";


const formSchema = z.object({
    name: z
        .string()
        .min(1, { message: "Name is required" })
        .max(100, { message: "Name can't exceed 100 characters" }),
    email: z
        .string()
        .email({ message: "Invalid email address" }),
    websiteOrFacebook: z
        .string(), // Optional field, not required
    exampleDesign: z.object({
        name: z.string(),
        url: z.string()
    }),
    message: z
        .string()
        .min(1, { message: "Message is required" })
        .max(500, { message: "Message can't exceed 500 characters" })
});

export { formSchema };
