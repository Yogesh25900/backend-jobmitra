import { CreateJobDTO, UpdateJobDTO } from "../dtos/job.dto";
import { JobRepository } from "../repositories/job.repository";
import { JobApplicationRepository } from "../repositories/jobApplication.repository";
import { TalentUserRepository } from "../repositories/talentUser.repository";
import { ITalentUser } from "../models/talentUser_model";
import { HttpError } from "../errors/http-error";
import { notifyCandidatesOnNewJob } from "./notification.service";
import { jobIndex } from "../config/meilisearch.client";

let jobRepository = new JobRepository();
let jobApplicationRepository = new JobApplicationRepository();
let talentUserRepository = new TalentUserRepository();

export class JobService {
  // Create a new job
  async createJob(jobData: CreateJobDTO) {
    try {
      const newJob = await jobRepository.createJob(jobData);
      if (newJob?._id) {
        await notifyCandidatesOnNewJob(newJob._id.toString());
      }
      return newJob;
    } catch (error: any) {
      throw new HttpError(500, `Error creating job,${error.message}` );
    }
  }

  // Get job by ID
  async getJobById(id: string) {
    const job = await jobRepository.getJobById(id);
    if (!job) {
      throw new HttpError(404, "Job not found");
    }
    return job;
  }

  // Get all jobs by employer
  async getJobsByEmployerId(
    employerId: string,
    page: number = 1,
    size: number = 5,
    status?: "Active" | "Inactive",
    searchQuery?: string,
  ) {
    const skip = (page - 1) * size;
    const { data, total } = await jobRepository.getJobsByEmployerId(
      employerId,
      skip,
      size,
      status,
      searchQuery,
    );
    
    // Add application counts to each job
    const jobsWithCounts = await Promise.all(
      data.map(async (job: any) => {
        const applicantCount = await jobApplicationRepository.countApplicationsByJobId(job._id.toString());
        // Convert Mongoose document to plain object to preserve all fields when spreading
        const jobObj = job.toObject ? job.toObject() : job;
        return {
          ...jobObj,
          applicantCount,
        };
      })
    );
    
    const totalPages = Math.ceil(total / size);
    return {
      data: jobsWithCounts,
      total,
      page,
      size,
      totalPages,
    };
  }

  // Count total jobs for an employer
  async countJobsByEmployerId(employerId: string): Promise<number> {
    return await jobRepository.countJobsByEmployerId(employerId);
  }

  // Get all jobs
  async getAllJobs(page: number = 1, size: number = 10, status?: string | null, search?: string | null) {
    const allJobs = await jobRepository.getAllJobs(status, search);
    
    // Calculate pagination
    const total = allJobs.length;
    const totalPages = Math.ceil(total / size);
    const skip = (page - 1) * size;
    const paginatedJobs = allJobs.slice(skip, skip + size);

    return {
      data: paginatedJobs,
      metadata: {
        total,
        page,
        size,
        totalPages
      }
    };
  }

  // Get job statistics (counts by status)
  async getJobStats() {
    const stats = await jobRepository.getJobStats();
    return stats;
  }
  // Update job
  async updateJob(id: string, updates: UpdateJobDTO) {
    const job = await jobRepository.getJobById(id);
    if (!job) {
      throw new HttpError(404, "Job not found");
    }

    const updatedJob = await jobRepository.updateJob(id, updates);
    if (!updatedJob) {
      throw new HttpError(500, "Error updating job");
    }
    return updatedJob;
  }

  // Delete job
  async deleteJob(id: string) {
    const job = await jobRepository.getJobById(id);
    if (!job) {
      throw new HttpError(404, "Job not found");
    }

    const result = await jobRepository.deleteJob(id);
    return result;
  }

  // Search jobs with filters
  async searchJobs(filters: any, page: number = 1, size: number = 10) {
    const result = await jobRepository.searchJobs(filters, page, size);
    return {
      data: result.data,
      metadata: {
        total: result.total,
        page: result.page,
        size: result.size,
        totalPages: result.totalPages,
      },
    };
  }

  
async indexJobsInMeili() {
    try {
      // Clear old index first
      try {
        await jobIndex.deleteAllDocuments();
        console.log("[Meilisearch] Cleared old documents");
      } catch (clearError) {
        console.log("[Meilisearch] No old documents to clear");
      }

      const jobs = await jobRepository.getAllJobs();
      
      if (jobs.length === 0) {
        console.log("No jobs to index in Meilisearch");
        return;
      }

      // Import needed models
      const { Category } = await import("../models/category.model");
      const { EmployerUserModel } = await import("../models/employerUser.model");

      // Index ALL job fields with consistent naming (use original MongoDB field names)
      // Extract nested objects properly to match MongoDB direct path behavior
      const indexedJobs = await Promise.all(jobs.map(async (job: any) => {
        const jobObj = job.toObject ? job.toObject() : job;
        
        // Fetch category if jobCategory is an ID string or ObjectId
        let jobCategoryData = null;
        if (jobObj.jobCategory) {
          try {
            const category = await Category.findById(jobObj.jobCategory);
            if (category) {
              jobCategoryData = {
                _id: category._id?.toString ? category._id.toString() : category._id,
                name: category.name,
                description: category.description,
                icon: category.icon,
                color: category.color,
              };
            }
          } catch (err) {
            console.log("[Meilisearch] Failed to fetch category:", jobObj.jobCategory);
          }
        }
        
        // Fetch employer if employerId exists (it's a String)
        let employerIdData = null;
        if (jobObj.employerId) {
          try {
            const employer = await EmployerUserModel.findById(jobObj.employerId);
            if (employer) {
              employerIdData = {
                _id: employer._id?.toString ? employer._id.toString() : employer._id,
                companyName: employer.companyName,
                logoPath: employer.logoPath,
                website: employer.website,
                companySize: employer.companySize,
              };
            }
          } catch (err) {
            console.log("[Meilisearch] Failed to fetch employer:", jobObj.employerId);
          }
        }
        
        return {
          id: jobObj._id?.toString() || jobObj._id,
          _id: jobObj._id?.toString() || jobObj._id,
          jobTitle: jobObj.jobTitle,
          companyName: jobObj.companyName,
          jobLocation: jobObj.jobLocation,
          jobType: jobObj.jobType,
          experienceLevel: jobObj.experienceLevel,
          jobCategory: jobCategoryData,
          jobDescription: jobObj.jobDescription,
          applicationDeadline: jobObj.applicationDeadline,
          responsibilities: jobObj.responsibilities || [],
          qualifications: jobObj.qualifications || [],
          tags: jobObj.tags || [],
          companyProfilePicPath: jobObj.companyProfilePicPath,
          status: jobObj.status,
          employerId: employerIdData,
          createdAt: jobObj.createdAt,
          updatedAt: jobObj.updatedAt,
        };
      }));

      // Add all documents to Meilisearch
      await jobIndex.addDocuments(indexedJobs);

      // Set filterable attributes for search filtering
      await jobIndex.updateFilterableAttributes([
        "jobLocation",
        "experienceLevel",
        "jobType",
        "tags",
        "status",
        "employerId",
      ]);

      console.log(`[Meilisearch] Indexed ${indexedJobs.length} jobs with all fields`);
    } catch (error: any) {
      console.error("[Meilisearch] Error indexing jobs:", error.message);
      throw error;
    }
  }

}
