import { Request, Response } from "express";
import { NotificationModel } from "../models/notification.model";
import { getUserNotificationsWithPagination } from "../services/notification.service";
import { GetNotificationsDto } from "../types/notification.type";

export class NotificationController {
  async getUserNotifications(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { page = 1, size = 10, type, isRead, searchQuery, sortBy, sortOrder } = req.query;
      
      console.log(' [NotificationController] getUserNotifications called');
      console.log('[NotificationController] Requested userId:', userId);
      
      // Validate pagination params
      const validation = GetNotificationsDto.safeParse({
        page: page ? parseInt(page as string) : 1,
        size: size ? parseInt(size as string) : 10,
        type: type ? (type as string) : undefined,
        isRead: isRead ? isRead === 'true' : undefined,
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
        type: validation.data.type,
        isRead: validation.data.isRead,
        searchQuery: validation.data.searchQuery,
        sortBy: validation.data.sortBy,
        sortOrder: validation.data.sortOrder,
      };

      const result = await getUserNotificationsWithPagination(
        userId,
        validation.data.page,
        validation.data.size,
        filters
      );

      console.log(' [NotificationController] Found notifications:', result.data.length);
      
      if (result.data.length > 0) {
        console.log('[NotificationController] Sample notification userIds:', 
          result.data.slice(0, 3).map(n => n.userId));
      }

      return res.status(200).json({
        success: true,
        message: "Notifications retrieved successfully",
        data: result.data,
        total: result.total,
        page: result.page,
        size: result.size,
        totalPages: result.totalPages,
      });
    } catch (error: any) {
      console.error('[NotificationController] Error:', error.message);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch notifications",
      });
    }
  }
}
