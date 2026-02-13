import { Request, Response } from "express";

import z from "zod";
import { EmployerUserService } from "../services/employerUser.service";
import { createEmployerDto, loginEmployerDto, verifyOTPDto, resetPasswordDto, verifyOtpAndResetPasswordDto } from "../dtos/employerUser.dto";
import { HttpError } from "../errors/http-error";

const employerUserService = new EmployerUserService();

// Helper function to filter user data
const filterUserData = (user: any) => {
  if (!user) return null;
  const userData = user.toObject ? user.toObject() : user;
  return {
    _id: userData._id,
    companyName: userData.companyName,
    contactName: userData.contactName,
    contactEmail: userData.contactEmail,
    email: userData.email,
    phoneNumber: userData.phoneNumber,
    role: userData.role,
    industry: userData.industry,
    location: userData.location,
    companySize: userData.companySize,
    website: userData.website,
    description: userData.description,
    socialLinks: userData.socialLinks,
    logoPath: userData.logoPath,
    googleProfilePicture: userData.googleProfilePicture,
    profilePicturePath: userData.logoPath || userData.googleProfilePicture,
  };
};

const filterUsersArray = (users: any[]) => users.map(user => filterUserData(user));

export class EmployerUserController {
  
  async registerEmployer(req: Request, res: Response) {
    try {
      const parsedData = createEmployerDto.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsedData.error),
        });
      }

      const newEmployer = await employerUserService.registerEmployer(parsedData.data);
      return res.status(201).json({
        success: true,
        message: "Employer registered successfully",
        data: filterUserData(newEmployer),
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }


  async loginEmployer(req: Request, res: Response) {
    try {
      const parsedData = loginEmployerDto.safeParse(req.body);
      if (!parsedData.success) {
        throw new HttpError(400, "Invalid credentials");
      }

      const { token, employer } = await employerUserService.loginEmployer(parsedData.data);
      return res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        data: filterUserData(employer),
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }


  async getAllEmployers(req: Request, res: Response) {
    try {
      const employers = await employerUserService.getAllEmployers();
      return res.status(200).json({
        success: true,
        data: filterUsersArray(employers),
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }


  async getEmployerById(req: Request, res: Response) {
    try {
      const employer = await employerUserService.getEmployerById(req.params.id);
      return res.status(200).json({
        success: true,
        data: filterUserData(employer),
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }


  async updateEmployer(req: Request, res: Response) {
    try {
      const updates = { ...req.body } as any;
      if (req.file) {
        updates.logoPath = req.file.filename;
      }

      const updatedEmployer = await employerUserService.updateEmployer(req.params.id, updates);
      return res.status(200).json({
        success: true,
        message: "Employer updated successfully",
        data: filterUserData(updatedEmployer),
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  // Send password reset OTP
  async sendPasswordResetOtp(req: Request, res: Response) {
    try {
      const parsedData = z.object({
        email: z.string().min(1, "Email is required").email("Invalid email format"),
      }).safeParse(req.body);

      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsedData.error),
        });
      }

      const result = await employerUserService.sendPasswordResetOtp(parsedData.data);
      return res.status(200).json({
        success: true,
        message: result.message,
        data: { email: result.email },
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  // Verify OTP (step 2 of password reset)
  async verifyOTP(req: Request, res: Response) {
    try {
      const parsedData = verifyOTPDto.safeParse(req.body);

      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: parsedData.error.format(),
        });
      }

      const result = await employerUserService.verifyOTP(parsedData.data);
      return res.status(200).json({
        success: true,
        message: result.message,
        data: { email: result.email },
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  // Reset password (step 3 of password reset)
  async resetPassword(req: Request, res: Response) {
    try {
      const parsedData = resetPasswordDto.safeParse(req.body);

      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: parsedData.error.format(),
        });
      }

      const result = await employerUserService.resetPassword(parsedData.data);
      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  // Verify OTP and reset password (backward compatibility)
  async verifyOtpAndResetPassword(req: Request, res: Response) {
    try {
      const parsedData = verifyOtpAndResetPasswordDto.safeParse(req.body);

      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsedData.error),
        });
      }

      const result = await employerUserService.verifyOtpAndResetPassword(parsedData.data);
      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }
}
