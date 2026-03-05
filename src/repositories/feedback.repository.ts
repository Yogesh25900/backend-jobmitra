import { FeedbackModel, IFeedback } from "../models/feedback.model";
import { FeedbackType } from "../types/feedback.type";

export class FeedbackRepository {
  async create(feedbackData: Partial<FeedbackType>): Promise<IFeedback> {
    const feedback = new FeedbackModel(feedbackData);
    return await feedback.save();
  }

  async findById(id: string): Promise<IFeedback | null> {
    return await FeedbackModel.findById(id).populate("resolvedBy");
  }

  async findAll(): Promise<IFeedback[]> {
    return await FeedbackModel.find().sort({ createdAt: -1 });
  }

  async findByUserId(userId: string, skip: number = 0, limit: number = 10): Promise<{ data: IFeedback[]; total: number }> {
    const data = await FeedbackModel.find({ userId })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await FeedbackModel.countDocuments({ userId });

    return { data, total };
  }

  async findWithFilters(
    filters: {
      page: number;
      size: number;
      status?: string;
      issueType?: string;
      priority?: string;
      userId?: string;
      sortBy?: string;
      sortOrder?: string;
    }
  ): Promise<{ data: IFeedback[]; total: number; pages: number }> {
    const skip = (filters.page - 1) * filters.size;
    const sortOrderValue = filters.sortOrder === "asc" ? 1 : -1;

    const query: any = {};

    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.issueType) {
      query.issueType = filters.issueType;
    }
    if (filters.priority) {
      query.priority = filters.priority;
    }
    if (filters.userId) {
      query.userId = filters.userId;
    }

    const data = await FeedbackModel.find(query)
      .skip(skip)
      .limit(filters.size)
      .sort({ [filters.sortBy || "createdAt"]: sortOrderValue })
      .populate("resolvedBy", "fname lname email");

    const total = await FeedbackModel.countDocuments(query);
    const pages = Math.ceil(total / filters.size);

    return { data, total, pages };
  }

  async updateById(id: string, updates: Partial<IFeedback>): Promise<IFeedback | null> {
    return await FeedbackModel.findByIdAndUpdate(id, updates, { new: true }).populate("resolvedBy");
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await FeedbackModel.findByIdAndDelete(id);
    return result !== null;
  }

  async countByStatus(status: string): Promise<number> {
    return await FeedbackModel.countDocuments({ status });
  }

  async countByIssueType(issueType: string): Promise<number> {
    return await FeedbackModel.countDocuments({ issueType });
  }

  async getStats(): Promise<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    byType: { [key: string]: number };
    byPriority: { [key: string]: number };
  }> {
    const total = await FeedbackModel.countDocuments();
    const open = await FeedbackModel.countDocuments({ status: "open" });
    const inProgress = await FeedbackModel.countDocuments({ status: "in_progress" });
    const resolved = await FeedbackModel.countDocuments({ status: "resolved" });
    const closed = await FeedbackModel.countDocuments({ status: "closed" });

    const byType = await FeedbackModel.aggregate([
      {
        $group: {
          _id: "$issueType",
          count: { $sum: 1 },
        },
      },
    ]);

    const byPriority = await FeedbackModel.aggregate([
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
    ]);

    const typeMap: { [key: string]: number } = {};
    byType.forEach((item: any) => {
      typeMap[item._id] = item.count;
    });

    const priorityMap: { [key: string]: number } = {};
    byPriority.forEach((item: any) => {
      priorityMap[item._id] = item.count;
    });

    return {
      total,
      open,
      inProgress,
      resolved,
      closed,
      byType: typeMap,
      byPriority: priorityMap,
    };
  }
}
