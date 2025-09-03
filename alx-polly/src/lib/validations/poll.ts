import { z } from 'zod'
import { PollType, PollCategory } from '@/types/pollTypes'

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
  
  // Enhanced poll settings
  pollType: z.nativeEnum(PollType).default(PollType.SINGLE_CHOICE),
  category: z.nativeEnum(PollCategory).default(PollCategory.GENERAL),
  maxSelections: z.number().min(1).max(10).optional(),
  minSelections: z.number().min(1).optional(),
  allowOtherOption: z.boolean().default(false),
  randomizeOptions: z.boolean().default(false),
  showResults: z.enum(['always', 'after_voting', 'after_expiry']).default('after_voting'),
  allowComments: z.boolean().default(false),
  requireReason: z.boolean().default(false),
  
  // Rating-specific settings
  maxRating: z.number().min(3).max(10).optional(),
  minRating: z.number().min(1).max(5).optional(),
  scaleType: z.enum(['stars', 'numbers', 'thumbs', 'hearts']).optional(),
}).refine((data) => {
  // Validation for multiple choice polls
  if (data.pollType === PollType.MULTIPLE_CHOICE) {
    return data.maxSelections && data.maxSelections > 1;
  }
  return true;
}, {
  message: "Multiple choice polls must have maxSelections > 1",
  path: ["maxSelections"]
}).refine((data) => {
  // Ensure minSelections <= maxSelections for multiple choice
  if (data.pollType === PollType.MULTIPLE_CHOICE && data.minSelections && data.maxSelections) {
    return data.minSelections <= data.maxSelections;
  }
  return true;
}, {
  message: "Minimum selections cannot be greater than maximum selections",
  path: ["minSelections"]
})

// Voting schemas for different poll types
export const SingleChoiceVoteSchema = z.object({
  pollId: z.string().uuid('Invalid poll ID'),
  optionId: z.string().uuid('Invalid option ID'),
  reason: z.string().max(200).optional(),
})

export const MultipleChoiceVoteSchema = z.object({
  pollId: z.string().uuid('Invalid poll ID'),
  optionIds: z.array(z.string().uuid()).min(1, 'At least one option must be selected').max(10),
  otherText: z.string().max(100).optional(),
  reason: z.string().max(200).optional(),
})

export const RankingVoteSchema = z.object({
  pollId: z.string().uuid('Invalid poll ID'),
  rankings: z.array(z.object({
    optionId: z.string().uuid(),
    rank: z.number().min(1),
  })).min(2, 'At least 2 options must be ranked'),
  reason: z.string().max(200).optional(),
})

export const RatingVoteSchema = z.object({
  pollId: z.string().uuid('Invalid poll ID'),
  ratings: z.array(z.object({
    optionId: z.string().uuid(),
    rating: z.number().min(1).max(10),
  })).min(1, 'At least one rating must be provided'),
  reason: z.string().max(200).optional(),
})

export const PollCommentSchema = z.object({
  pollId: z.string().uuid('Invalid poll ID'),
  content: z.string().min(1, 'Comment cannot be empty').max(500, 'Comment too long'),
  isAnonymous: z.boolean().default(false),
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
