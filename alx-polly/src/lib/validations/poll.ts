import { z } from 'zod'

// Poll validation schemas
export const CreatePollSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().optional(),
  options: z
    .array(z.string().min(1, 'Option cannot be empty').max(100, 'Option too long'))
    .min(2, 'At least 2 options required')
    .max(10, 'Maximum 10 options allowed'),
  expiresIn: z.number().min(1).max(24 * 60), // minutes, max 24 hours
  allowMultipleVotes: z.boolean().default(false),
  requireAuth: z.boolean().default(true),
})

export const VoteSchema = z.object({
  pollId: z.string().uuid(),
  optionId: z.string().uuid(),
})

export const UpdatePollSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

// Type inference
export type CreatePollInput = z.infer<typeof CreatePollSchema>
export type VoteInput = z.infer<typeof VoteSchema>
export type UpdatePollInput = z.infer<typeof UpdatePollSchema>
