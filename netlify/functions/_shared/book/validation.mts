import { z } from 'zod'

export const checkoutSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(10),
  couponCode: z.string().trim().max(64).optional().or(z.literal('')),
  customer: z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(180),
    phone: z.string().trim().min(8).max(32),
  }),
  address: z.object({
    name: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(8).max(32),
    street: z.string().trim().min(2).max(160),
    exteriorNumber: z.string().trim().min(1).max(32),
    interiorNumber: z.string().trim().max(32).optional().or(z.literal('')),
    neighborhood: z.string().trim().min(2).max(120),
    city: z.string().trim().min(2).max(120),
    state: z.string().trim().min(2).max(80),
    postalCode: z.string().trim().regex(/^[0-9]{5}$/),
    references: z.string().trim().max(400).optional().or(z.literal('')),
  }),
})

export const couponValidationSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(10),
  couponCode: z.string().trim().min(1).max(64),
})

export const internationalQuoteSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  whatsapp: z.string().trim().min(8).max(32),
  country: z.string().trim().min(2).max(120),
  city: z.string().trim().min(2).max(120),
  postalCode: z.string().trim().min(2).max(32),
  quantity: z.coerce.number().int().min(1).max(50),
  message: z.string().trim().max(800).optional().or(z.literal('')),
})

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(200),
})
