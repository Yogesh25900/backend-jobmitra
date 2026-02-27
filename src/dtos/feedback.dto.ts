import { z } from "zod";
import { FeedbackSchema } from "../types/feedback.type";

export const createFeedbackDto = FeedbackSchema.pick({
  subject: true,
  description: true,
  issueType: true,
});

export const updateFeedbackDto = z.object({
  status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  resolutionNotes: z.string().max(2000).optional(),
});

export const feedbackFiltersDto = z.object({
  page: z.number().positive().default(1),
  size: z.number().positive().default(10),
  status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
  issueType: z.enum(["bug", "feature_request", "account_issue", "other"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  userId: z.string().optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "priority"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateFeedbackDTO = z.infer<typeof createFeedbackDto>;
export type UpdateFeedbackDTO = z.infer<typeof updateFeedbackDto>;
export type FeedbackFiltersDTO = z.infer<typeof feedbackFiltersDto>;
