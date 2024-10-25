import { z } from "zod";
import { uploadDesignSchema } from "./upload.validation";

export type UploadDesignSchemaInterface = z.infer<typeof uploadDesignSchema>;

export type DataItem = {
  name: string[];
};