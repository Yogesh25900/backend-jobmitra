import { Request, Response } from "express";

import z from "zod";
import { TalentUserService } from "../services/talentUser.service";
import { createTalentDto, loginTalentDto } from "../dtos/talentUser.dto";
import { HttpError } from "../errors/http-error";

const talentUserService = new TalentUserService();

// Helper function to filter user data
const filterUserData = (user: any) => {
  if (!user) return null;
  const userData = user.toObject ? user.toObject() : user;
  return {
    _id: userData._id,
    fname: userData.fname,
    lname: userData.lname,
    email: userData.email,
    phoneNumber: userData.phoneNumber,
    role: userData.role,
    profilePicturePath: userData.profilePicturePath || userData.googleProfilePicture,
  };
};

const filterUsersArray = (users: any[]) => users.map(user => filterUserData(user));

export class TalentUserController {
  
  async registerTalent(req: Request, res: Response) {
    try {
      const parsedData = createTalentDto.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsedData.error),
        });
      }

      const newTalent = await talentUserService.registerTalent(parsedData.data);
      return res.status(201).json({
        success: true,
        message: "Talent registered successfully",
        data: filterUserData(newTalent),
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }


  async loginTalent(req: Request, res: Response) {
    try {
      const parsedData = loginTalentDto.safeParse(req.body);
      if (!parsedData.success) {
        throw new HttpError(400, "Invalid credentials");
      }

      const { token, talent } = await talentUserService.loginTalent(parsedData.data);
      return res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        data: filterUserData(talent),
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }


  async getAllTalents(req: Request, res: Response) {
    try {
      const talents = await talentUserService.getAllTalents();
      return res.status(200).json({
        success: true,
        data: filterUsersArray(talents),
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }


  async getTalentById(req: Request, res: Response) {
    try {
      const talent = await talentUserService.getTalentById(req.params.id);
      return res.status(200).json({
        success: true,
        data: filterUserData(talent),
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }


  async updateTalent(req: Request, res: Response) {
    try {
      const updatedTalent = await talentUserService.updateTalent(req.params.id, req.body);
      return res.status(200).json({
        success: true,
        message: "Talent updated successfully",
        data: filterUserData(updatedTalent),
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }
}
