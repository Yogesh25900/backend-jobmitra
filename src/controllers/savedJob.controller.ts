import { Request, Response } from "express";
import { SavedJobService } from "../services/savedJob.service";
import { HttpError } from "../errors/http-error";
import { addSavedJobDto, getSavedJobsDto } from "../dtos/savedJob.dto";

const savedJobService = new SavedJobService();

export class SavedJobController {
  // Add job to saved list
  async addSavedJob(req: Request, res: Response) {
    try {
      const talentUserId = req.user?._id || req.user?.id;
      const { jobId } = req.body;

      // Validate input
      const validation = addSavedJobDto.safeParse({ jobId });
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid job ID",
          errors: validation.error.issues,
        });
      }

      const result = await savedJobService.addSavedJob(
        talentUserId,
        jobId
      );

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }
      return res.status(500).json({
        success: false,
        message: "Error adding saved job",
      });
    }
  }

  // Remove job from saved list
  async removeSavedJob(req: Request, res: Response) {
    try {
      const talentUserId = req.user?._id || req.user?.id;
      const { jobId } = req.params;

      if (!jobId) {
        return res.status(400).json({
          success: false,
          message: "Job ID is required",
        });
      }

      const result = await savedJobService.removeSavedJob(
        talentUserId,
        jobId
      );

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }
      return res.status(500).json({
        success: false,
        message: "Error removing saved job",
      });
    }
  }

  // Get all saved jobs with pagination
  async getSavedJobs(req: Request, res: Response) {
    try {
      const talentUserId = req.user?._id || req.user?.id;
      const { page = 1, size = 10 } = req.query;

      // Validate pagination params
      const validation = getSavedJobsDto.safeParse({
        page: page ? parseInt(page as string) : 1,
        size: size ? parseInt(size as string) : 10,
      });

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid pagination parameters",
          errors: validation.error.issues,
        });
      }

      const result = await savedJobService.getSavedJobs(
        talentUserId,
        validation.data.page,
        validation.data.size
      );

      return res.status(200).json({
        success: true,
        message: "Saved jobs retrieved successfully",
        data: result,
      });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }
      return res.status(500).json({
        success: false,
        message: "Error fetching saved jobs",
      });
    }
  }

  // Get saved job IDs only (for quick checking in lists)
  async getSavedJobIds(req: Request, res: Response) {
    try {
      const talentUserId = req.user?._id || req.user?.id;

      const savedJobIds = await savedJobService.getSavedJobIds(talentUserId);

      return res.status(200).json({
        success: true,
        message: "Saved job IDs retrieved successfully",
        data: {
          savedJobIds,
        },
      });
    } catch (error: any) {
      if (error instanceof HttpError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }
      return res.status(500).json({
        success: false,
        message: "Error fetching saved job IDs",
      });
    }
  }
}
