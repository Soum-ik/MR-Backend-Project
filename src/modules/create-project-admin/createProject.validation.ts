// libs/validation.ts

import { z } from 'zod';

export const createProjectSchema = z.object({
  id: z.string().optional(),
  projectImage: z.string().url().optional(),
  originalAmount: z.string().optional(),
  offerAmount: z.string().optional(),
  delivery: z.string().optional(),
  extraFastDelivery: z.string().optional(),
  extraFastDeliveryAmount: z.string().optional(),
  bullPoints: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  freeDesignName: z.string(),
  freeDesignTypographys: z.array(z.string()).default([]),
  // Add optional CreateProjectDesign fields if applicable
  designs: z.array(z.object({
    designName: z.string(),
    designView: z.array(z.string()).default([]),
  }))
});

export const designs = z.object({
  id: z.string().optional(), // id is required during updates
  designName: z.string(),
  designTypogrphys: z.array(z.string()).default([]),
})

export const updateProjectSchema = z.object({
  projectImage: z.string().url().optional(),
  originalAmount: z.string().optional(),
  offerAmount: z.string().optional(),
  delivery: z.string().optional(),
  extraFastDelivery: z.string().optional(),
  extraFastDeliveryAmount: z.string().optional(),
  bullPoints: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  freeDesignName: z.string(),
  freeDesignTypographys: z.array(z.string()).default([]),
  // In the update schema, each CreateProjectDesign requires an id
  CreateProjectDesigns: z.array(designs).optional()
});

