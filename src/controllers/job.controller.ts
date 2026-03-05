import { Request, Response } from "express";
import z from "zod";
import { JobService } from "../services/job.service";
import { createJobDto, updateJobDto, getJobsDto } from "../dtos/job.dto";
import { HttpError } from "../errors/http-error";
import { jobIndex } from "../config/meilisearch.client";

const jobService = new JobService();

const filterJobData = (job: any) => {
  if (!job) return null;
  const jobData = job.toObject ? job.toObject() : job;
  
  const employerData = jobData.employerId && typeof jobData.employerId === 'object'
    ? {
        _id: jobData.employerId._id,
        companyName: jobData.employerId.companyName,
        companySize: jobData.employerId.companySize,
       
        website: jobData.employerId.website,
        logoPath: jobData.employerId.logoPath || jobData.employerId.companyProfilePicPath,
      }
    : jobData.employerId;

  return {
    _id: jobData._id,
    jobTitle: jobData.jobTitle,
    companyName: jobData.companyName,
    jobLocation: jobData.jobLocation,
    jobType: jobData.jobType,
    experienceLevel: jobData.experienceLevel,
    jobCategory: jobData.jobCategory,
    jobDescription: jobData.jobDescription,
    applicationDeadline: jobData.applicationDeadline,
    responsibilities: jobData.responsibilities,
    qualifications: jobData.qualifications,
    tags: jobData.tags,
    companyProfilePicPath: jobData.companyProfilePicPath,
    logoPath: jobData.companyProfilePicPath,
    status: jobData.status,
    employerId: employerData,
    createdAt: jobData.createdAt,
    updatedAt: jobData.updatedAt,
    applicationCount: jobData.applicantCount || 0,
  };
};

const filterJobsArray = (jobs: any[]) => jobs.map(job => filterJobData(job));

export class JobController {
  
  async createJob(req: Request, res: Response) {
    try {
      const parsedData = createJobDto.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsedData.error),
        });
      }

      const jobDataWithEmployer = {
        ...parsedData.data,
        employerId: req.user._id,
      };

      const newJob = await jobService.createJob(jobDataWithEmployer);
      return res.status(201).json({
        success: true,
        message: "Job created successfully",
        data: filterJobData(newJob),
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  async getJobById(req: Request, res: Response) {
    try {
      const job = await jobService.getJobById(req.params.id);
      return res.status(200).json({
        success: true,
        data: filterJobData(job),
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  async getJobsByEmployerId(req: Request, res: Response) {
    try {
      const result = await jobService.getJobsByEmployerId(req.params.employerId);
      const jobs = Array.isArray(result) ? result : result.data;
      return res.status(200).json({
        success: true,
        data: filterJobsArray(jobs),
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  async getMyJobs(req: Request, res: Response) {
    try {
      const { page = 1, size = 5, searchQuery, status } = req.query;
      
      const validatedParams = getJobsDto.safeParse({
        page: parseInt(page as string, 10),
        size: parseInt(size as string, 10),
        searchQuery: searchQuery as string | undefined,
        status: status as "Active" | "Inactive" | undefined,
      });

      if (!validatedParams.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(validatedParams.error),
        });
      }
      
      const result = await jobService.getJobsByEmployerId(
        req.user._id,
        validatedParams.data.page,
        validatedParams.data.size,
        validatedParams.data.status,
        validatedParams.data.searchQuery
      );
      
      return res.status(200).json({
        success: true,
        data: filterJobsArray(result.data),
        total: result.total,
        page: result.page,
        size: result.size,
        totalPages: result.totalPages,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  async getAllJobs(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const size = parseInt(req.query.size as string) || 10;
      const status = (req.query.status as string) || null;
      const search = (req.query.search as string) || null;
      
      const result = await jobService.getAllJobs(page, size, status, search);
      return res.status(200).json({
        success: true,
        data: filterJobsArray(result.data),
        metadata: result.metadata,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  async getJobStats(req: Request, res: Response) {
    try {
      const stats = await jobService.getJobStats();
      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }
  async updateJob(req: Request, res: Response) {
    try {
      const parsedData = updateJobDto.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsedData.error),
        });
      }

      const job = await jobService.getJobById(req.params.id);
      
      if (req.user.role !== "admin") {
        const employerId = (job.employerId as any)?._id || job.employerId;

        if (employerId?.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: "Not authorized to update this job",
          });
        }
      }

      const updatedJob = await jobService.updateJob(req.params.id, parsedData.data);
      return res.status(200).json({
        success: true,
        message: "Job updated successfully",
        data: filterJobData(updatedJob),
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  async deleteJob(req: Request, res: Response) {
    try {
      const job = await jobService.getJobById(req.params.id);
      
      if (req.user.role !== "admin") {
        const employerId = (job.employerId as any)?._id || job.employerId;

        console.log('Employer found for deletion:', employerId);
        console.log('Authenticated user ID:', req.user._id);
        if (employerId?.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: "Not authorized to delete this job",
          });
        }
      }

      const result = await jobService.deleteJob(req.params.id);
      return res.status(200).json({
        success: true,
        message: "Job deleted successfully",
        data: { deleted: result },
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  async getMyJobStats(req: Request, res: Response) {
    try {
      const employerId = req.user._id;
      const totalJobs = await jobService.countJobsByEmployerId(employerId);

      return res.status(200).json({
        success: true,
        message: "Job stats retrieved successfully",
        data: {
          totalJobs,
        },
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }


async searchJobs(req: Request, res: Response) {
    const page = parseInt(req.query.page as string) || 1;
    const size = parseInt(req.query.size as string) || 10;
    const sortBy = req.query.sortBy as string; // 'Newest' | 'Oldest'
    const { page: _page, size: _size, sortBy: _sortBy, ...filters } = req.query;

    const normalizedFilters: Record<string, string> = {};
    Object.entries(filters).forEach(([key, value]) => {
      const normalizedValue = value?.toString().trim();
      if (normalizedValue) {
        normalizedFilters[key] = normalizedValue;
      }
    });

    console.log('[Search] Query params:', { page, size, sortBy, filters: normalizedFilters });

    try {
      const needsClientSideFiltering =
        Boolean(normalizedFilters.jobCategory) ||
        (sortBy && (sortBy === 'Newest' || sortBy === 'Oldest'));

      const searchOptions: any = {
        limit: needsClientSideFiltering ? 100 : size,
        offset: needsClientSideFiltering ? 0 : (page - 1) * size,
      };

      const filterArray: string[] = [];
      if (normalizedFilters.jobLocation) {
        const normalizedLocation = normalizedFilters.jobLocation.trim().toLowerCase();
        filterArray.push(`jobLocation = "${normalizedLocation}"`);
      }
      if (normalizedFilters.jobType) {
        filterArray.push(`jobType = "${normalizedFilters.jobType}"`);
      }
      if (normalizedFilters.experienceLevel) {
        filterArray.push(`experienceLevel = "${normalizedFilters.experienceLevel}"`);
      }
      if (normalizedFilters.status) {
        filterArray.push(`status = "${normalizedFilters.status}"`);
      }

      if (normalizedFilters.jobCategory) {
        filterArray.push(`jobCategory._id = "${normalizedFilters.jobCategory}"`);
      }

      if (filterArray.length > 0) {
        searchOptions.filter = filterArray.join(" AND ");
      }

      const query = normalizedFilters.jobTitle || "";
      const searchResult = await jobIndex.search(query, searchOptions);

      let transformedData = searchResult.hits.map((hit: any) => ({
        ...hit,
        _id: hit._id || hit.id,
      }));

      if (sortBy && (sortBy === 'Newest' || sortBy === 'Oldest')) {
        transformedData.sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return sortBy === 'Oldest' ? dateA - dateB : dateB - dateA;
        });
      }

      if (normalizedFilters.jobCategory) {
        const categoryId = normalizedFilters.jobCategory;
        transformedData = transformedData.filter((job: any) => {
          const jobCategoryId =
            job.jobCategory?._id ||
            job.jobCategory?.id ||
            (typeof job.jobCategory === 'string' ? job.jobCategory : null);
          return jobCategoryId === categoryId;
        });
      }

      const totalFilteredJobs = transformedData.length;
      const paginatedData = needsClientSideFiltering
        ? transformedData.slice((page - 1) * size, (page - 1) * size + size)
        : transformedData;

      return res.status(200).json({
        success: true,
        data: paginatedData,
        metadata: {
          total: totalFilteredJobs,
          page,
          size,
          totalPages: Math.ceil(totalFilteredJobs / size),
        },
      });
    } catch (meiliError: any) {
      console.warn('[Search] Meilisearch failed, falling back to MongoDB:', {
        message: meiliError?.message,
        code: meiliError?.code,
      });

      try {
        const fallbackResult = await jobService.searchJobs(
          {
            ...normalizedFilters,
            ...(sortBy ? { sortBy } : {}),
          },
          page,
          size,
        );

        return res.status(200).json({
          success: true,
          data: filterJobsArray(fallbackResult.data),
          metadata: fallbackResult.metadata,
        });
      } catch (fallbackError: any) {
        console.error('[Search] Both Meilisearch and MongoDB fallback failed:', {
          meiliError: meiliError?.message,
          fallbackError: fallbackError?.message,
        });

        return res.status(500).json({
          success: false,
          message: 'Search failed on both search engines',
          error: fallbackError?.message || meiliError?.message || 'Unknown search failure',
        });
      }
    }
  }

}
