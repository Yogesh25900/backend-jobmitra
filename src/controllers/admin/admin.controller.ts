import { Request, Response } from "express";
import { AdminService } from "../../services/admin/admin.service";
import { createAdminDto, loginAdminDto, createUserByAdminDto } from "../../dtos/admin.dto";
import { HttpError } from "../../errors/http-error";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../../config";
import z from "zod";

const adminUserService = new AdminService();

// Helper function to filter admin data
const filterAdminData = (admin: any) => {
  if (!admin) return null;
  const adminData = admin.toObject ? admin.toObject() : admin;
  return {
    _id: adminData._id,
    email: adminData.email,
    role: adminData.role,
    createdAt: adminData.createdAt,
    updatedAt: adminData.updatedAt,
  };
};

// Helper function to filter user data
const filterUserData = (user: any) => {
  if (!user) return null;
  const userData = user.toObject ? user.toObject() : user;
  
  // Check if it's an employer or talent based on fields
  if (userData.companyName) {
    return {
      _id: userData._id,
      companyName: userData.companyName,
      contactName: userData.contactName,
      email: userData.email,
      phoneNumber: userData.phoneNumber,
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
      role: userData.role,
      profilePicturePath: userData.profilePicturePath || userData.googleProfilePicture,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
    };
  }
};

const filterUsersArray = (users: any[]) => users.map(user => filterUserData(user));

export class AdminController {
  
  // Create a new admin
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
      const parsedData = createUserByAdminDto.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsedData.error),
        });
      }

      const { userType, userData } = parsedData.data;
      
      // If a file was uploaded, add the filename to userData
      if (req.file) {
        userData.profilePicturePath = req.file.filename;
      }

      const newUser = await adminUserService.createUserAsAdmin(userType, userData);
      
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
      
      const result = await adminUserService.getAllUsers(page, size);
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
      
      // If a file was uploaded, add the filename to updateData
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
}