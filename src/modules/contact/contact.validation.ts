import { z } from "zod";

const formSchema = z.object({
  timeAndDate: z.bigint().optional(),
  name: z
    .string().optional(),
  email: z.string().email({ message: "Invalid email address" }).optional(),
  websiteOrFacebook: z.string().optional(), // Optional field, not required
  exampleDesign: z.array(
    z.object({
      name: z.string(),
      url: z.string(),
      size: z.number(),
    })
  ).optional(),
  message: z
    .string()
    .min(1, { message: "Message is required" })
    .max(500, { message: "Message can't exceed 500 characters" }),
});

export { formSchema };
