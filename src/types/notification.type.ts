import { z } from "zod";

export const NotificationSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  type: z.enum(["application", "job", "shortlisted", "status_update", "test"]),
  isRead: z.boolean().optional(),
  createdAt: z.date().optional(),
});

export type NotificationType = z.infer<typeof NotificationSchema>;

export const GetNotificationsDto = z.object({
  page: z.number().positive().default(1),
  size: z.number().positive().default(5),
  type: z.enum(["application", "job", "shortlisted", "status_update", "test"]).optional(),
  isRead: z.boolean().optional(), // Filter by read status
  searchQuery: z.string().optional(), // Search by title or message
  sortBy: z.enum(["createdAt", "title", "isRead"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type GetNotificationsDTO = z.infer<typeof GetNotificationsDto>;
