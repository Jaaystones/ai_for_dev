
import { z } from 'zod';

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  username: z.string().max(50).nullable(),
  full_name: z.string().nullable(),
  avatar_url: z.string().url().nullable(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

export const PollSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  created_by: z.string().uuid(),
  created_at: z.string().datetime().optional(),
  expires_at: z.string().datetime(),
  is_active: z.boolean().default(true),
  allow_multiple_votes: z.boolean().default(false),
  require_auth: z.boolean().default(true),
  qr_code_url: z.string().url().nullable(),
  total_votes: z.number().int().default(0),
  settings: z.record(z.string(), z.any()).optional(),
});

export const PollOptionSchema = z.object({
  id: z.string().uuid(),
  poll_id: z.string().uuid(),
  text: z.string(),
  description: z.string().nullable(),
  order_index: z.number().int().default(0),
  vote_count: z.number().int().default(0),
  created_at: z.string().datetime().optional(),
});

export const VoteSchema = z.object({
  id: z.string().uuid(),
  poll_id: z.string().uuid(),
  option_id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  ip_address: z.string().nullable(),
  user_agent: z.string().nullable(),
  created_at: z.string().datetime().optional(),
});

export const PollViewSchema = z.object({
  id: z.string().uuid(),
  poll_id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  ip_address: z.string().nullable(),
  user_agent: z.string().nullable(),
  referrer: z.string().nullable(),
  created_at: z.string().datetime().optional(),
});

