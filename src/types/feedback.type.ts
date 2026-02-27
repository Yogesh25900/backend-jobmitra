import { z } from "zod";
import { Types } from "mongoose";

// Feedback schema
export const FeedbackSchema = z.object({
  userId: z.string(),
  userName: z.string().min(1, "User name is required"),
  userRole: z.enum(["candidate", "employer", "admin"]),
  email: z.string().email("Valid email is required"),
  subject: z.string().min(5, "Subject must be at least 5 characters").max(200),
  description: z.string().min(10, "Description must be at least 10 characters").max(5000),
  issueType: z.enum(["bug", "feature_request", "account_issue", "other"]).default("other"),
  status: z.enum(["open", "in_progress", "resolved", "closed"]).default("open"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  screenshotPath: z.string().optional(),
  attachmentPath: z.string().optional(),
  resolutionNotes: z.string().max(2000).optional(),
  resolvedBy: z.string().optional(),
  resolvedAt: z.date().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// TypeScript type
export type FeedbackType = z.infer<typeof FeedbackSchema> & {
  _id?: Types.ObjectId;
};
