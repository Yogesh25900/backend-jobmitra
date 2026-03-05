import { z } from "zod";
import { Types } from "mongoose";

// Job schema
export const JobSchema = z.object({
  jobTitle: z.string().min(2, "Job title is required"),
  companyName: z.string().min(2, "Company name is required"),
  jobLocation: z.string().min(1, "Job location is required"),
  jobType: z.string().min(1, "Job type is required"),
  experienceLevel: z.string().min(1, "Experience level is required"),
  jobCategory: z.string().optional(), // Can be ObjectId or empty
  jobDescription: z.string().min(10, "Job description is required"),
  applicationDeadline: z.string().min(1, "Application deadline is required"),

  responsibilities: z.array(z.string()).optional().default([]),
  qualifications: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),

  companyProfilePicPath: z.string().optional().default(""),
  status: z.enum(["Active", "Inactive", "Closed"]).default("Active"),

  employerId: z.string(),

  createdAt: z.date().optional().default(() => new Date()),
});

// TypeScript type (same pattern you used)
export type JobType = z.infer<typeof JobSchema> & {
  jobCategory?: Types.ObjectId | string;
  employerId: Types.ObjectId | string;
};
