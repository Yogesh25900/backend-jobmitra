import { Request, Response } from "express";
import axios from "axios";
import { JobApplicationService } from "../services/jobApplication.service";
import { JobApplicationSchema } from "../types/jobApplication.type";
import { GetApplicationsDto } from "../types/jobApplication.type";
import { JobApplicationDTO } from "../dtos/jobApplication.dto";
import { TalentUserModel } from "../models/talentUser_model";
import { JobRepository } from "../repositories/job.repository";
import {
  decrementApplicationsInFlight,
  incrementApplicationsInFlight,
  getApplicationsInFlight,
} from "../utils/applications-concurrency";

const jobApplicationService = new JobApplicationService();
const jobRepository = new JobRepository();
const PYTHON_API = "http://127.0.0.1:8000/recommend";

// Create Job Application
export const createJobApplication = async (req: Request, res: Response) => {
  const inFlightNow = incrementApplicationsInFlight();
  res.setHeader("X-Applications-In-Flight", inFlightNow.toString());

  try {
    const applicationData = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // Extract jobId from request body
    const jobId = applicationData.jobId;
    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: "Job ID is required",
      });
    }

    // Fetch the job to get employerId
    const job = await jobRepository.getJobById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Set employerId from the job document (extract ID if populated)
    applicationData.employerId = typeof job.employerId === 'object' && job.employerId !== null && '_id' in job.employerId
      ? (job.employerId as any)._id.toString() 
      : String(job.employerId);
    console.log('🔵 [Controller] createApplication - setting employerId:', applicationData.employerId, 'type:', typeof applicationData.employerId);

    // Extract file paths
    if (files && files['resume'] && files['resume'][0]) {
      applicationData.resumePath = files['resume'][0].filename;
    }
    if (files && files['coverLetterDocument'] && files['coverLetterDocument'][0]) {
      applicationData.coverLetterPath = files['coverLetterDocument'][0].filename;
    }

    if (applicationData.keySkills) {
      if (typeof applicationData.keySkills === "string" && applicationData.keySkills.trim()) {
        try {
          // Try parsing as JSON array first
          applicationData.keySkills = JSON.parse(applicationData.keySkills);
        } catch {
          // If not JSON, treat as CSV string and split
          applicationData.keySkills = applicationData.keySkills
            .split(",")
            .map((skill: string) => skill.trim())
            .filter((skill: string) => skill.length > 0);
        }
      } else if (typeof applicationData.keySkills === "string") {
        // Empty string - convert to empty array
        applicationData.keySkills = [];
      }
    } else {
      // Undefined - set to empty array
      applicationData.keySkills = [];
    }
    
    if (applicationData.relevantCertifications) {
      if (typeof applicationData.relevantCertifications === "string" && applicationData.relevantCertifications.trim()) {
        try {
          // Try parsing as JSON array first
          applicationData.relevantCertifications = JSON.parse(applicationData.relevantCertifications);
        } catch {
          // If not JSON, treat as CSV string and split
          applicationData.relevantCertifications = applicationData.relevantCertifications
            .split(",")
            .map((cert: string) => cert.trim())
            .filter((cert: string) => cert.length > 0);
        }
      } else if (typeof applicationData.relevantCertifications === "string") {
        // Empty string - convert to empty array
        applicationData.relevantCertifications = [];
      }
    } else {
      // Undefined - set to empty array
      applicationData.relevantCertifications = [];
    }

    // Convert yearsOfExperience to number
    if (applicationData.yearsOfExperience) {
      applicationData.yearsOfExperience = Number(applicationData.yearsOfExperience);
    }

    // Fix URLs - add https:// if missing protocol, or set to undefined if empty
    const urlFields = ['portfolioUrl', 'linkedinUrl', 'githubUrl'];
    urlFields.forEach(field => {
      if (applicationData[field]) {
        const url = applicationData[field].trim();
        if (url === '') {
          // Empty string - remove field so it's optional
          delete applicationData[field];
        } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
          // Add https:// prefix
          applicationData[field] = `https://${url}`;
        }
      } else {
        // Undefined or null - remove field
        delete applicationData[field];
      }
    });

    console.log('Application data before validation:', JSON.stringify(applicationData, null, 2));

    // Validate data
    const validatedData = JobApplicationSchema.parse(applicationData);

    const application = await jobApplicationService.createApplication(validatedData);

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: application,
    });
  } catch (error: any) {
    console.error('Error in createJobApplication:', error);
    console.error('Error name:', error.name);
    console.error('Error errors:', error.errors);
    
    if (error.name === "ZodError" && error.errors && Array.isArray(error.errors)) {
      const errors = error.errors.map((err: any) => `${err.path.join(".")}: ${err.message}`);
      return res.status(400).json({
        success: false,
        message: errors.join(", "),
      });
    }
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to submit application",
    });
  } finally {
    const remaining = decrementApplicationsInFlight();
    if (!res.headersSent) {
      res.setHeader("X-Applications-In-Flight", getApplicationsInFlight().toString());
    }
    console.log("[Concurrency] In-flight application submissions:", remaining);
  }
};

// Get Application by ID
export const getApplicationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const application = await jobApplicationService.getApplicationById(id);

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch application",
    });
  }
};

// Get All Applications
export const getAllApplications = async (req: Request, res: Response) => {
  try {
    const applications = await jobApplicationService.getAllApplications();

    res.status(200).json({
      success: true,
      data: applications,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch applications",
    });
  }
};

export const getApplicationsByJobId = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const { page = 1, size = 10, status, searchQuery, sortBy, sortOrder } = req.query;
    
    console.log('[Controller] getApplicationsByJobId called with jobId:', jobId);
    
    // Validate pagination params
    const validation = GetApplicationsDto.safeParse({
      page: page ? parseInt(page as string) : 1,
      size: size ? parseInt(size as string) : 10,
      status: status ? (status as string) : undefined,
      searchQuery: searchQuery ? (searchQuery as string) : undefined,
      sortBy: sortBy ? (sortBy as string) : undefined,
      sortOrder: sortOrder ? (sortOrder as string) : undefined,
    });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: validation.error.issues,
      });
    }

    const filters = {
      status: validation.data.status,
      searchQuery: validation.data.searchQuery,
      sortBy: validation.data.sortBy,
      sortOrder: validation.data.sortOrder,
    };

    const result = await jobApplicationService.getApplicationsByJobId(
      jobId,
      validation.data.page,
      validation.data.size,
      filters
    );

    console.log('[Controller] Got applications:', result.data.length);

    res.status(200).json({
      success: true,
      message: "Applications retrieved successfully",
      data: result.data,
      total: result.total,
      page: result.page,
      size: result.size,
      totalPages: result.totalPages,
    });
  } catch (error: any) {
    console.error(' [Controller] Error:', error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch applications",
    });
  }
};

// Get Applications by Job with AI Match Score
export const getApplicationsByJobIdWithScore = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    console.log(" [Controller] getApplicationsByJobIdWithScore called with jobId:", jobId);

    // Fetch applications with scoring (use large size to get many results)
    const result = await jobApplicationService.getApplicationsByJobId(jobId, 1, 1000, {});
    const applications = result.data;
    console.log(" [Controller] Got applications:", applications.length);

    const scoredApplications = await Promise.all(
      applications.map(async (app: any) => {
        let matchScore = 0;
        let profilePicturePath = null;

        try {
          if (app.talentId) {
            console.log("[Controller] Processing app with talentId:", app.talentId);
            
            // Fetch match score from Python API
            const response = await axios.get(`${PYTHON_API}/${app.talentId}`, {
              params: { topN: 3, threshold: 0.3 },
            });

            const matches = response.data;
            const jobMatch = Array.isArray(matches)
              ? matches.find((m: any) => m.id == jobId)
              : null;
            matchScore = jobMatch?.matchScore ?? 0;

            // Fetch talent user profile picture
            const talentUser = await TalentUserModel.findById(app.talentId);
            console.log("[Controller] TalentUser found:", talentUser ? "Yes" : "No");
            if (talentUser) {
              console.log("[Controller] TalentUser data:", {
                _id: talentUser._id,
                profilePicturePath: talentUser.profilePicturePath,
              });
              profilePicturePath = talentUser.profilePicturePath || null;
            }
          }
        } catch (err: any) {
          console.error("[Controller] Error scoring candidate:", err?.message || err);
        }

        const appObj = typeof app?.toObject === "function" ? app.toObject() : app;
        return {
          ...appObj,
          matchScore,
          profilePicturePath,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: scoredApplications,
    });
  } catch (error: any) {
    console.error("[Controller] Error in getApplicationsByJobIdWithScore:", error?.message || error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch applications with score",
    });
  }
};

// Get My Applications (Talent)
export const getMyApplications = async (req: Request, res: Response) => {
  try {
    const { page = 1, size = 10, status, searchQuery, sortBy, sortOrder } = req.query;
    
    console.log('[Controller] getMyApplications called');
    console.log('[Controller] req.user:', (req as any).user);
    
    const talentId = (req as any).user.userId; // From auth middleware
    
    console.log('[Controller] Querying for talentId:', talentId);
    
    // Validate pagination params
    const validation = GetApplicationsDto.safeParse({
      page: page ? parseInt(page as string) : 1,
      size: size ? parseInt(size as string) : 10,
      status: status ? (status as string) : undefined,
      searchQuery: searchQuery ? (searchQuery as string) : undefined,
      sortBy: sortBy ? (sortBy as string) : undefined,
      sortOrder: sortOrder ? (sortOrder as string) : undefined,
    });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: validation.error.issues,
      });
    }

    const filters = {
      status: validation.data.status,
      searchQuery: validation.data.searchQuery,
      sortBy: validation.data.sortBy,
      sortOrder: validation.data.sortOrder,
    };
    
    const result = await jobApplicationService.getApplicationsByTalentId(
      talentId,
      validation.data.page,
      validation.data.size,
      filters
    );
    
    console.log('[Controller] Found applications:', result.data.length);

    res.status(200).json({
      success: true,
      message: "Applications retrieved successfully",
      data: result.data,
      total: result.total,
      page: result.page,
      size: result.size,
      totalPages: result.totalPages,
    });
  } catch (error: any) {
    console.error('[Controller] Error in getMyApplications:', error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch applications",
    });
  }
};

// Get My Application Stats (Talent)
export const getMyApplicationStats = async (req: Request, res: Response) => {
  try {
    const talentId = req.user._id.toString();

    const stats = await jobApplicationService.getApplicationStatsByTalentId(talentId);

    res.status(200).json({
      success: true,
      message: "Application stats retrieved successfully",
      data: stats,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch application stats",
    });
  }
};

// Get Applications for Employer's Jobs
export const getEmployerApplications = async (req: Request, res: Response) => {
  try {
    const { page = 1, size = 10, status, searchQuery, sortBy, sortOrder } = req.query;
    
    const employerId = req.user._id.toString(); // From auth middleware
    
    // Validate pagination params
    const validation = GetApplicationsDto.safeParse({
      page: page ? parseInt(page as string) : 1,
      size: size ? parseInt(size as string) : 10,
      status: status ? (status as string) : undefined,
      searchQuery: searchQuery ? (searchQuery as string) : undefined,
      sortBy: sortBy ? (sortBy as string) : undefined,
      sortOrder: sortOrder ? (sortOrder as string) : undefined,
    });

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: validation.error.issues,
      });
    }

    const filters = {
      status: validation.data.status,
      searchQuery: validation.data.searchQuery,
      sortBy: validation.data.sortBy,
      sortOrder: validation.data.sortOrder,
    };

    const result = await jobApplicationService.getApplicationsByEmployerId(
      employerId,
      validation.data.page,
      validation.data.size,
      filters
    );

    res.status(200).json({
      success: true,
      message: "Applications retrieved successfully",
      data: result.data,
      total: result.total,
      page: result.page,
      size: result.size,
      totalPages: result.totalPages,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch applications",
    });
  }
};

// Update Application Status
export const updateApplicationStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log('[Controller] updateApplicationStatus called');
    console.log('[Controller] applicationId:', id);
    console.log('[Controller] newStatus:', status);

    const application = await jobApplicationService.updateApplicationStatus(id, status);

    console.log(' [Controller] Application status updated successfully');
    console.log('[Controller] Updated application:', {
      _id: application._id,
      talentId: application.talentId,
      status: application.status,
    });

    res.status(200).json({
      success: true,
      message: "Application status updated successfully",
      data: application,
    });
  } catch (error: any) {
    console.error('[Controller] Error updating status:', error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to update application status",
    });
  }
};

// Delete Application
export const deleteApplication = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await jobApplicationService.deleteApplication(id);

    res.status(200).json({
      success: true,
      message: "Application deleted successfully",
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to delete application",
    });
  }
};

// Get Employer Application Stats
export const getEmployerApplicationStats = async (req: Request, res: Response) => {
  try {
    const employerId = req.user._id.toString();
    console.log('[Controller] getEmployerApplicationStats - employerId:', employerId, 'type:', typeof employerId);
    console.log('[Controller] req.user._id:', req.user._id, 'type:', typeof req.user._id);

    const stats = await jobApplicationService.getApplicationStatsByEmployerId(employerId);

    res.status(200).json({
      success: true,
      message: "Application stats retrieved successfully",
      data: stats,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch application stats",
    });
  }
};
