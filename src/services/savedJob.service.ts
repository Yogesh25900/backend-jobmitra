import { SavedJobRepository } from "../repositories/savedJob.repository";
import { JobRepository } from "../repositories/job.repository";
import { HttpError } from "../errors/http-error";

const savedJobRepository = new SavedJobRepository();
const jobRepository = new JobRepository();

export class SavedJobService {
  // Add a job to saved list
  async addSavedJob(talentUserId: string, jobId: string) {
    try {
      // Verify job exists
      const job = await jobRepository.getJobById(jobId);
      if (!job) {
        throw new HttpError(404, "Job not found");
      }

      // Add to saved jobs
      const savedJob = await savedJobRepository.addSavedJob(
        talentUserId,
        jobId
      );
      return {
        message: "Job saved successfully",
        data: savedJob,
      };
    } catch (error: any) {
      if (error instanceof HttpError) {
        throw error;
      }
      if (error.code === 11000) {
        // Duplicate key error - job already saved
        throw new HttpError(400, "Job is already saved");
      }
      throw new HttpError(500, "Error saving job");
    }
  }

  // Remove a job from saved list
  async removeSavedJob(talentUserId: string, jobId: string) {
    try {
      const result = await savedJobRepository.removeSavedJob(
        talentUserId,
        jobId
      );

      if (!result) {
        throw new HttpError(404, "Saved job not found");
      }

      return {
        message: "Job removed from saved list",
      };
    } catch (error: any) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(500, "Error removing saved job");
    }
  }

  // Get all saved jobs for a talent user
  async getSavedJobs(
    talentUserId: string,
    page: number = 1,
    size: number = 10
  ) {
    try {
      const result = await savedJobRepository.getSavedJobs(
        talentUserId,
        page,
        size
      );

      // Get full job details for each saved job
      const jobIds = result.data.map((savedJob) => savedJob.jobId.toString());
      const jobs = await jobRepository.getJobsByIds(jobIds);

      // Create map for quick lookup (convert to plain objects)
      const jobMap = new Map(
        jobs.map((job) => [
          job._id.toString(),
          job.toObject ? job.toObject() : job,
        ])
      );

      // Return jobs with saved metadata (convert to plain objects)
      const enrichedJobs = result.data.map((savedJob) => ({
        ...jobMap.get(savedJob.jobId.toString()),
        savedAt: savedJob.savedAt,
      }));

      return {
        data: enrichedJobs,
        total: result.total,
        page: result.page,
        size: result.size,
        totalPages: result.totalPages,
      };
    } catch (error: any) {
      throw new HttpError(500, "Error fetching saved jobs");
    }
  }

  // Check if a job is saved
  async isSaved(talentUserId: string, jobId: string): Promise<boolean> {
    try {
      return await savedJobRepository.isSaved(talentUserId, jobId);
    } catch (error: any) {
      throw new HttpError(500, "Error checking saved status");
    }
  }

  // Get saved job IDs for a talent user (for frontend filtering)
  async getSavedJobIds(talentUserId: string): Promise<string[]> {
    try {
      return await savedJobRepository.getSavedJobIds(talentUserId);
    } catch (error: any) {
      throw new HttpError(500, "Error fetching saved job IDs");
    }
  }
}
