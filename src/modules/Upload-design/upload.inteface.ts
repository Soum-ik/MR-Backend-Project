import { z } from "zod";
import { uploadDesignSchema } from "./upload.validation";

export type UploadDesign = z.infer<typeof uploadDesignSchema>;