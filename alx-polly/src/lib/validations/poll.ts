import { z } from 'zod'

// Enhanced poll validation schemas
export const CreatePollSchema = z.object({
  title: z.string()
    .min(10, 'Question must be at least 10 characters')
    .max(200, 'Question cannot exceed 200 characters')
    .trim()
    .refine(val => val.endsWith('?'), 'Question should end with a question mark'),
  description: z.string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional()
    .or(z.literal('')),
  options: z
    .array(z.string().min(1, 'Option cannot be empty').max(100, 'Option too long').trim())
    .min(2, 'At least 2 options are required')
    .max(10, 'Maximum 10 options allowed')
    .refine(options => new Set(options).size === options.length, 'Options must be unique'),
  expiresIn: z.number()
    .min(5, 'Minimum expiry time is 5 minutes')
    .max(24 * 60 * 7, 'Maximum expiry time is 1 week'), // minutes, max 1 week
  allowMultipleVotes: z.boolean().default(false),
  requireAuth: z.boolean().default(true),
})

export const VoteSchema = z.object({
  pollId: z.string().uuid('Invalid poll ID'),
  optionId: z.string().uuid('Invalid option ID'),
})

export const UpdatePollSchema = z.object({
  title: z.string().min(10).max(200).optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
})

// Type inference
export type CreatePollInput = z.infer<typeof CreatePollSchema>
export type VoteInput = z.infer<typeof VoteSchema>
export type UpdatePollInput = z.infer<typeof UpdatePollSchema>
