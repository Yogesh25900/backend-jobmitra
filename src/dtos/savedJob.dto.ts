import { z } from "zod";

export const SavedJobSchema = z.object({
  talentUserId: z.string().min(1, "Talent user ID is required"),
  jobId: z.string().min(1, "Job ID is required"),
  savedAt: z.date().optional(),
});

export const addSavedJobDto = SavedJobSchema.pick({
  jobId: true,
});

export const getSavedJobsDto = z.object({
  page: z.number().positive().default(1),
  size: z.number().positive().default(5),
});


export type SavedJobType = z.infer<typeof SavedJobSchema>;
export type AddSavedJobDTO = z.infer<typeof addSavedJobDto>;
export type GetSavedJobsDTO = z.infer<typeof getSavedJobsDto>;
