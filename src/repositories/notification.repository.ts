import { NotificationModel, NotificationDocument } from "../models/notification.model";

export class NotificationRepository {
  async create(notificationData: any): Promise<NotificationDocument> {
    const notification = new NotificationModel(notificationData);
    return await notification.save();
  }

  async findById(id: string): Promise<NotificationDocument | null> {
    return await NotificationModel.findById(id);
  }

  async findByUserIdPaginated(
    userId: string,
    skip: number = 0,
    limit: number = 10,
    filters?: any
  ): Promise<{ data: NotificationDocument[]; total: number }> {
    const query: any = { userId };

    if (filters?.type) {
      query.type = filters.type;
    }

    if (filters?.isRead !== undefined) {
      query.isRead = filters.isRead;
    }

    if (filters?.searchQuery) {
      query.$or = [
        { title: { $regex: filters.searchQuery, $options: "i" } },
        { message: { $regex: filters.searchQuery, $options: "i" } },
      ];
    }

    const sortBy = filters?.sortBy || "createdAt";
    const sortOrder = filters?.sortOrder === "asc" ? 1 : -1;

    const notifications = await NotificationModel.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder });

    const total = await NotificationModel.countDocuments(query);

    return { data: notifications, total };
  }

  async updateStatus(id: string, isRead: boolean): Promise<NotificationDocument | null> {
    return await NotificationModel.findByIdAndUpdate(id, { isRead }, { new: true });
  }

  async delete(id: string): Promise<NotificationDocument | null> {
    return await NotificationModel.findByIdAndDelete(id);
  }
}
