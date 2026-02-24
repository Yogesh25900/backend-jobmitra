import { z } from "zod";
import { JobSchema } from "../types/job.type";

export const createJobDto = JobSchema.pick({
  jobTitle: true,
  companyName: true,
  jobLocation: true,
  jobType: true,
  experienceLevel: true,
  jobCategory: true,
  jobDescription: true,
  applicationDeadline: true,
  responsibilities: true,
  qualifications: true,
  tags: true,
});

export const updateJobDto = JobSchema.partial().extend({
  status: z.enum(["Active", "Inactive", "Closed"]).optional(),
  companyProfilePicPath: z.string().optional(),
});

export const getJobsDto = z.object({
  page: z.number().positive().default(1),
  size: z.number().positive().default(5),
  searchQuery: z.string().optional(),
  status: z.enum(["Active", "Inactive"]).optional(),
});

export type CreateJobDTO = z.infer<typeof createJobDto>;
export type UpdateJobDTO = z.infer<typeof updateJobDto>;
export type GetJobsDTO = z.infer<typeof getJobsDto>;
