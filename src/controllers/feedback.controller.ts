import { Request, Response } from "express";
import { FeedbackService } from "../services/feedback.service";
import { createFeedbackDto, updateFeedbackDto, feedbackFiltersDto } from "../dtos/feedback.dto";
import z from "zod";

const feedbackService = new FeedbackService();

export class FeedbackController {
  async createFeedback(req: Request, res: Response) {
    try {
      const parsedData = createFeedbackDto.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsedData.error),
        });
      }

      const userId = req.user?._id?.toString();
      const userName = req.user?.fname ? `${req.user.fname} ${req.user.lname || ""}` : "Unknown";
      const userRole = req.user?.role || "candidate";
      const email = req.user?.email || "";

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      let screenshotPath: string | undefined;
      let attachmentPath: string | undefined;

      if (files?.screenshot?.length > 0) {
        screenshotPath = files.screenshot[0].filename;
      }
      if (files?.attachment?.length > 0) {
        attachmentPath = files.attachment[0].filename;
      }

      const feedback = await feedbackService.createFeedback(
        userId,
        userName,
        userRole as any,
        email,
        parsedData.data,
        screenshotPath,
        attachmentPath
      );

      return res.status(201).json({
        success: true,
        message: "Feedback submitted successfully. We appreciate your input!",
        data: feedback,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  // Get feedback by ID (user or admin)
  async getFeedbackById(req: Request, res: Response) {
    try {
      const feedback = await feedbackService.getFeedbackById(req.params.id);

      const userId = req.user?._id?.toString();
      const userRole = req.user?.role;
      if (userRole !== "admin" && feedback.userId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to view this feedback",
        });
      }

      return res.status(200).json({
        success: true,
        data: feedback,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  // Get user's own feedback
  async getUserFeedback(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const size = parseInt(req.query.size as string) || 10;

      const userId = req.user?._id?.toString();
      const result = await feedbackService.getFeedbackByUserId(userId, page, size);

      return res.status(200).json({
        success: true,
        data: result.data,
        metadata: result.metadata,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  // Get all feedback with filters (admin only)
  async getAllFeedback(req: Request, res: Response) {
    try {
      // Verify admin role
      if (req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only admins can access this endpoint",
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const size = parseInt(req.query.size as string) || 10;
      const status = (req.query.status as string) || undefined;
      const issueType = (req.query.issueType as string) || undefined;
      const priority = (req.query.priority as string) || undefined;
      const sortBy = (req.query.sortBy as string) || "createdAt";
      const sortOrder = (req.query.sortOrder as string) || "desc";

      const filters = {
        page,
        size,
        status,
        issueType,
        priority,
        sortBy,
        sortOrder,
      };

      const parsedFilters = feedbackFiltersDto.safeParse(filters);
      if (!parsedFilters.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsedFilters.error),
        });
      }

      const result = await feedbackService.getFeedbackWithFilters(parsedFilters.data);

      return res.status(200).json({
        success: true,
        data: result.data,
        metadata: result.metadata,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  // Update feedback status (admin only)
  async updateFeedback(req: Request, res: Response) {
    try {
      // Verify admin role
      if (req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only admins can update feedback",
        });
      }

      const parsedData = updateFeedbackDto.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsedData.error),
        });
      }

      const adminId = req.user?._id?.toString();
      const updated = await feedbackService.updateFeedback(req.params.id, parsedData.data, adminId);

      return res.status(200).json({
        success: true,
        message: "Feedback updated successfully",
        data: updated,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  // Delete feedback (admin only)
  async deleteFeedback(req: Request, res: Response) {
    try {
      // Verify admin role
      if (req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only admins can delete feedback",
        });
      }

      const deleted = await feedbackService.deleteFeedback(req.params.id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Feedback not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Feedback deleted successfully",
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  // Get feedback statistics (admin only)
  async getFeedbackStats(req: Request, res: Response) {
    try {
      // Verify admin role
      if (req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only admins can access this endpoint",
        });
      }

      const stats = await feedbackService.getFeedbackStats();

      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }
}
