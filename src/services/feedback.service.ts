import { CreateFeedbackDTO, UpdateFeedbackDTO, FeedbackFiltersDTO } from "../dtos/feedback.dto";
import { FeedbackRepository } from "../repositories/feedback.repository";
import { HttpError } from "../errors/http-error";
import { IFeedback } from "../models/feedback.model";

const feedbackRepository = new FeedbackRepository();

export class FeedbackService {
  // Create a new feedback
  async createFeedback(
    userId: string,
    userName: string,
    userRole: "candidate" | "employer" | "admin",
    email: string,
    feedbackData: CreateFeedbackDTO,
    screenshotPath?: string,
    attachmentPath?: string
  ): Promise<IFeedback> {
    try {
      const feedback = await feedbackRepository.create({
        userId,
        userName,
        userRole,
        email,
        ...feedbackData,
        screenshotPath,
        attachmentPath,
        status: "open",
        priority: "medium",
      });
      return feedback;
    } catch (error: any) {
      throw new HttpError(500, `Error creating feedback: ${error.message}`);
    }
  }

  // Get feedback by ID
  async getFeedbackById(id: string): Promise<IFeedback> {
    const feedback = await feedbackRepository.findById(id);
    if (!feedback) {
      throw new HttpError(404, "Feedback not found");
    }
    return feedback;
  }

  // Get all feedback (admin)
  async getAllFeedback(page: number = 1, size: number = 10): Promise<{
    data: IFeedback[];
    metadata: { total: number; page: number; size: number; totalPages: number };
  }> {
    const skip = (page - 1) * size;
    const { data, total } = await feedbackRepository.findByUserId("", skip, size);

    return {
      data,
      metadata: {
        total,
        page,
        size,
        totalPages: Math.ceil(total / size),
      },
    };
  }

  // Get feedback by user ID
  async getFeedbackByUserId(
    userId: string,
    page: number = 1,
    size: number = 10
  ): Promise<{
    data: IFeedback[];
    metadata: { total: number; page: number; size: number; totalPages: number };
  }> {
    const skip = (page - 1) * size;
    const { data, total } = await feedbackRepository.findByUserId(userId, skip, size);

    return {
      data,
      metadata: {
        total,
        page,
        size,
        totalPages: Math.ceil(total / size),
      },
    };
  }

  // Get feedback with filters
  async getFeedbackWithFilters(filters: FeedbackFiltersDTO): Promise<{
    data: IFeedback[];
    metadata: { total: number; page: number; size: number; totalPages: number };
  }> {
    const { data, total, pages } = await feedbackRepository.findWithFilters(filters);

    return {
      data,
      metadata: {
        total,
        page: filters.page,
        size: filters.size,
        totalPages: pages,
      },
    };
  }

  // Update feedback status and notes (admin only)
  async updateFeedback(id: string, updates: UpdateFeedbackDTO, adminId: string): Promise<IFeedback> {
    const feedback = await feedbackRepository.findById(id);
    if (!feedback) {
      throw new HttpError(404, "Feedback not found");
    }

    const updatedData: any = { ...updates };
    if (updates.status === "resolved") {
      updatedData.resolvedBy = adminId;
      updatedData.resolvedAt = new Date();
    }

    const updated = await feedbackRepository.updateById(id, updatedData);
    if (!updated) {
      throw new HttpError(500, "Error updating feedback");
    }

    return updated;
  }

  // Delete feedback (admin only)
  async deleteFeedback(id: string): Promise<boolean> {
    const feedback = await feedbackRepository.findById(id);
    if (!feedback) {
      throw new HttpError(404, "Feedback not found");
    }

    return await feedbackRepository.deleteById(id);
  }

  // Get feedback statistics
  async getFeedbackStats(): Promise<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    byType: { [key: string]: number };
    byPriority: { [key: string]: number };
  }> {
    return await feedbackRepository.getStats();
  }
}
