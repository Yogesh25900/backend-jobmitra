import { Request, Response } from "express";
import { AdminService } from "../../services/admin/admin.service";
import { createAdminDto, loginAdminDto, createUserByAdminDto, updateAdminProfileDto, changeAdminPasswordDto } from "../../dtos/admin.dto";
import { HttpError } from "../../errors/http-error";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../../config";
import z from "zod";
import { JobModel } from "../../models/job.model";
import { JobApplicationModel } from "../../models/jobApplication.model";
import { TalentUserModel } from "../../models/talentUser_model";
import { EmployerUserModel } from "../../models/employerUser.model";
import { NotificationModel } from "../../models/notification.model";
import { FeedbackModel } from "../../models/feedback.model";

const adminUserService = new AdminService();

const filterAdminData = (admin: any) => {
  if (!admin) return null;
  const adminData = admin.toObject ? admin.toObject() : admin;
  return {
    _id: adminData._id,
    fname: adminData.fname,
    lname: adminData.lname,
    email: adminData.email,
    phoneNumber: adminData.phoneNumber,
    location: adminData.location,
    role: adminData.role,
    createdAt: adminData.createdAt,
    updatedAt: adminData.updatedAt,
  };
};

const filterUserData = (user: any) => {
  if (!user) return null;
  const userData = user.toObject ? user.toObject() : user;
  
  if (userData.companyName) {
    return {
      _id: userData._id,
      companyName: userData.companyName,
      contactName: userData.contactName,
      email: userData.email,
      phoneNumber: userData.phoneNumber,
      location: userData.location,
      role: userData.role,
      logoPath: userData.logoPath || userData.googleProfilePicture,
      profilePicturePath: userData.logoPath || userData.googleProfilePicture,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
    };
  } else {
    return {
      _id: userData._id,
      fname: userData.fname,
      lname: userData.lname,
      email: userData.email,
      phoneNumber: userData.phoneNumber,
      location: userData.location,
      role: userData.role,
      profilePicturePath: userData.profilePicturePath || userData.googleProfilePicture,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
    };
  }
};

const filterUsersArray = (users: any[]) => users.map(user => filterUserData(user));

export class AdminController {

  async getMyProfile(req: Request, res: Response) {
    try {
      const adminId = req.user?._id?.toString();
      const admin = await adminUserService.getAdminById(adminId);

      return res.status(200).json({
        success: true,
        data: filterAdminData(admin),
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  async updateMyProfile(req: Request, res: Response) {
    try {
      const parsedData = updateAdminProfileDto.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsedData.error),
        });
      }

      const adminId = req.user?._id?.toString();
      const updatedAdmin = await adminUserService.updateAdminProfile(adminId, parsedData.data);

      return res.status(200).json({
        success: true,
        message: "Admin profile updated successfully",
        data: filterAdminData(updatedAdmin),
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  async changeMyPassword(req: Request, res: Response) {
    try {
      const parsedData = changeAdminPasswordDto.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsedData.error),
        });
      }

      const adminId = req.user?._id?.toString();
      await adminUserService.changeAdminPassword(
        adminId,
        parsedData.data.currentPassword,
        parsedData.data.newPassword
      );

      return res.status(200).json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }
  
  async createAdmin(req: Request, res: Response) {
    try {
      const parsedData = createAdminDto.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsedData.error),
        });
      }

      const { confirmPassword, ...dataToSave } = parsedData.data;
      const newAdmin = await adminUserService.createAdmin(dataToSave);
      
      return res.status(201).json({
        success: true,
        message: "Admin created successfully",
        data: filterAdminData(newAdmin),
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  // Admin login
  async loginAdmin(req: Request, res: Response) {
    try {
      const parsedData = loginAdminDto.safeParse(req.body);
      if (!parsedData.success) {
        throw new HttpError(400, "Invalid credentials");
      }

      const admin = await adminUserService.loginAdmin(parsedData.data.email, parsedData.data.password);
      
      const payload = {
        id: admin._id,
        email: admin.email,
        role: admin.role,
      };

      const token = jwt.sign(payload, JWT_SECRET as string, { expiresIn: "24h" });
      
      return res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        data: filterAdminData(admin),
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  // Create user as admin (employer or talent)
  async createUserAsAdmin(req: Request, res: Response) {
    try {
      let userData: any = { ...req.body };
      let userType: string = '';
      
      // Check if it's the old nested format
      if (userData.userType && userData.userData) {
        userType = userData.userType;
        userData = userData.userData;
      } else {
        // New flat format from frontend
        // Convert role field to userType for service layer
        const role = userData.role;
        if (role === 'candidate') {
          userType = 'talent';
        } else if (role === 'employer') {
          userType = 'employer';
        } else {
          userType = role; // fallback
        }
        
        delete userData.role;
      }
      
      if (userType !== 'talent' && userType !== 'employer') {
        return res.status(400).json({
          success: false,
          message: "Invalid user type. Must be 'talent' or 'employer'.",
        });
      }
      
      if (req.file) {
        if (userType === "employer") {
          userData.logoPath = req.file.filename;
        } else {
          userData.profilePicturePath = req.file.filename;
        }
      }
  
      const newUser = await adminUserService.createUserAsAdmin(userType as "talent" | "employer", userData);
      
      return res.status(201).json({
        success: true,
        message: `${userType === "employer" ? "Employer" : "Talent"} user created successfully`,
        data: filterUserData(newUser),
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  // Get all users (employers and talents)
  async getAllUsers(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const size = parseInt(req.query.size as string) || 10;
      const search = (req.query.search as string) || "";
      const role = (req.query.role as string) || "";
      
      const result = await adminUserService.getAllUsers(page, size, search, role);
      return res.status(200).json({
        success: true,
        data: filterUsersArray(result.data),
        metadata: result.metadata,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  // Get user by ID
  async getUserById(req: Request, res: Response) {
    try {
      const user = await adminUserService.getUserById(req.params.id);
      return res.status(200).json({
        success: true,
        data: filterUserData(user),
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  // Update user by ID
  async updateUserById(req: Request, res: Response) {
    try {
      let updateData = req.body;
      
      if (req.file) {
        updateData.profilePicturePath = req.file.filename;
      }

      const updatedUser = await adminUserService.updateUserById(req.params.id, updateData);
      return res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: filterUserData(updatedUser),
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  // Delete user by ID
  async deleteUserById(req: Request, res: Response) {
    try {
      await adminUserService.deleteUserById(req.params.id);
      return res.status(200).json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  // Get dashboard statistics
  async getDashboardStats(req: Request, res: Response) {
    try {
      console.log('[Admin Controller] getDashboardStats called');
      
      // Get total number of users (talents + employers)
      const talentCount = await TalentUserModel.countDocuments();
      console.log('[Admin Controller] Talent count:', talentCount);
      
      const employerCount = await EmployerUserModel.countDocuments();
      console.log('[Admin Controller] Employer count:', employerCount);
      
      const totalUsers = talentCount + employerCount;

      // Get active jobs count
      const activeJobs = await JobModel.countDocuments({ status: "Active" });
      console.log('[Admin Controller] Active jobs:', activeJobs);

      // Get total job applications count
      const totalApplications = await JobApplicationModel.countDocuments();
      console.log('[Admin Controller] Total applications:', totalApplications);

      return res.status(200).json({
        success: true,
        data: {
          totalUsers,
          activeJobs,
          totalApplications,
          talentCount,
          employerCount,
        },
      });
    } catch (error: any) {
      console.error('[Admin Controller] Error in getDashboardStats:', error.message);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  // Get job posting trends by category for current year
  async getJobPostingTrends(req: Request, res: Response) {
    try {
      console.log('[Admin Controller] getJobPostingTrends called');
      
      const currentYear = new Date().getFullYear();
      const startDate = new Date(`${currentYear}-01-01`);
      const endDate = new Date(`${currentYear}-12-31`);

      console.log('[Admin Controller] Querying jobs from', startDate, 'to', endDate);

      // Aggregate job postings by category
      const trends = await JobModel.aggregate([
        {
          $match: {
            createdAt: {
              $gte: startDate,
              $lte: endDate,
            },
          },
        },
        {
          $group: {
            _id: "$jobCategory",
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "categories",
            localField: "_id",
            foreignField: "_id",
            as: "category",
          },
        },
        {
          $unwind: {
            path: "$category",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            count: 1,
            categoryName: { $ifNull: ["$category.name", "Uncategorized"] },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]);

      console.log('[Admin Controller] Found trends:', trends.length);

      // If no trends found, return empty array
      if (!trends || trends.length === 0) {
        return res.status(200).json({
          success: true,
          data: [],
          message: "No job posting trends data available",
        });
      }

      return res.status(200).json({
        success: true,
        data: trends,
      });
    } catch (error: any) {
      console.error('[Admin Controller] Error in getJobPostingTrends:', error.message);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  // Get recent activities (job postings, talent registrations, applications)
  async getRecentActivities(req: Request, res: Response) {
    try {
      console.log('[Admin Controller] getRecentActivities called');
      
      const limit = parseInt(req.query.limit as string) || 50;
      const skip = parseInt(req.query.skip as string) || 0;

      console.log('[Admin Controller] Fetching activities with limit:', limit, 'skip:', skip);

      // Fetch all relevant activity notifications from the database
      // These include: job postings, talent registrations, applications, verifications
      const activities = await NotificationModel.find({
        type: { $in: ["job_posted", "talent_joined", "application_submitted", "user_verified", "content_reported", "job", "application" ] }
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      console.log('[Admin Controller] Found activities:', activities.length);

      // Get total count for pagination
      const totalCount = await NotificationModel.countDocuments({
        type: { $in: ["job_posted", "talent_joined", "application_submitted", "user_verified", "content_reported", "job", "application" ] }
      });

      console.log('[Admin Controller] Total activity count:', totalCount);

      // Enrich activity data
      const enrichedActivities = activities.map((activity) => ({
        _id: activity._id,
        title: activity.title,
        description: activity.message,
        type: activity.type,
        time: activity.createdAt,
        icon: getActivityIcon(activity.type),
        color: getActivityColor(activity.type),
      }));

      console.log('[Admin Controller] Returning enriched activities:', enrichedActivities.length);

      return res.status(200).json({
        success: true,
        data: enrichedActivities,
        pagination: {
          total: totalCount,
          skip,
          limit,
          hasMore: (skip + limit) < totalCount,
        },
      });
    } catch (error: any) {
      console.error('[Admin Controller] Error in getRecentActivities:', error.message);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  // Feedback Management - Get all feedback
  async getAllFeedback(req: Request, res: Response) {
    try {
      console.log('[Admin Controller] getAllFeedback called');
      
      const page = parseInt(req.query.page as string) || 1;
      const size = parseInt(req.query.size as string) || 10;
      const status = (req.query.status as string) || undefined;
      const issueType = (req.query.issueType as string) || undefined;
      const priority = (req.query.priority as string) || undefined;
      const sortBy = (req.query.sortBy as string) || "createdAt";
      const sortOrder = (req.query.sortOrder as string) || "desc";

      const skip = (page - 1) * size;
      const sortOrderValue = sortOrder === "asc" ? 1 : -1;

      const query: any = {};
      if (status) query.status = status;
      if (issueType) query.issueType = issueType;
      if (priority) query.priority = priority;

      const feedbacks = await FeedbackModel.find(query)
        .skip(skip)
        .limit(size)
        .sort({ [sortBy]: sortOrderValue })
        .populate("resolvedBy", "fname lname email");

      const total = await FeedbackModel.countDocuments(query);
      const pages = Math.ceil(total / size);

      console.log('[Admin Controller] Fetched feedbacks:', feedbacks.length);

      return res.status(200).json({
        success: true,
        data: feedbacks,
        metadata: {
          total,
          page,
          size,
          pages,
        },
      });
    } catch (error: any) {
      console.error('[Admin Controller] Error in getAllFeedback:', error.message);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  // Feedback Management - Get feedback statistics
  async getFeedbackStats(req: Request, res: Response) {
    try {
      console.log('[Admin Controller] getFeedbackStats called');
      
      
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

      console.log('[Admin Controller] Feedback stats calculated');

      return res.status(200).json({
        success: true,
        data: {
          total,
          open,
          inProgress,
          resolved,
          closed,
          byType: typeMap,
          byPriority: priorityMap,
        },
      });
    } catch (error: any) {
      console.error('[Admin Controller] Error in getFeedbackStats:', error.message);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  // Feedback Management - Update feedback status
  async updateFeedbackStatus(req: Request, res: Response) {
    try {
      console.log('[Admin Controller] updateFeedbackStatus called');
      
      const { id } = req.params;
      const { status, resolutionNotes, priority } = req.body;

      
      const feedback = await FeedbackModel.findById(id);
      if (!feedback) {
        return res.status(404).json({
          success: false,
          message: "Feedback not found",
        });
      }

      const updateData: any = {};
      if (status) updateData.status = status;
      if (resolutionNotes) updateData.resolutionNotes = resolutionNotes;
      if (priority) updateData.priority = priority;
      
      if (status === "resolved") {
        updateData.resolvedBy = req.user?._id;
        updateData.resolvedAt = new Date();
      }

      const updated = await FeedbackModel.findByIdAndUpdate(id, updateData, { new: true }).populate("resolvedBy");

      console.log('[Admin Controller] Feedback updated:', id);

      return res.status(200).json({
        success: true,
        message: "Feedback updated successfully",
        data: updated,
      });
    } catch (error: any) {
      console.error('[Admin Controller] Error in updateFeedbackStatus:', error.message);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  // Feedback Management - Delete feedback
  async deleteFeedback(req: Request, res: Response) {
    try {
      console.log('[Admin Controller] deleteFeedback called');
      
      const { id } = req.params;

      
      const feedback = await FeedbackModel.findById(id);
      if (!feedback) {
        return res.status(404).json({
          success: false,
          message: "Feedback not found",
        });
      }

      await FeedbackModel.findByIdAndDelete(id);

      console.log('[Admin Controller] Feedback deleted:', id);

      return res.status(200).json({
        success: true,
        message: "Feedback deleted successfully",
      });
    } catch (error: any) {
      console.error('[Admin Controller] Error in deleteFeedback:', error.message);
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }
}

// Helper function to get activity icon based on type
function getActivityIcon(type: string): string {
  const iconMap: { [key: string]: string } = {
    "job_posted": "briefcase",
    "talent_joined": "user",
    "application_submitted": "file-text",
    "user_verified": "check-circle",
    "content_reported": "alert-circle",
  };
  return iconMap[type] || "activity";
}

// Helper function to get activity color based on type
function getActivityColor(type: string): string {
  const colorMap: { [key: string]: string } = {
    "job_posted": "indigo",
    "talent_joined": "primary",
    "application_submitted": "amber",
    "user_verified": "emerald",
    "content_reported": "red",
  };
  return colorMap[type] || "primary";
}