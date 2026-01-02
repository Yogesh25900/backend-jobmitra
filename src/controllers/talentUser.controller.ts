import { Request, Response } from "express";

import z from "zod";
import { TalentUserService } from "../services/talentUser.service";
import { createTalentDto, loginTalentDto } from "../dtos/talentUser.dto";
import { HttpError } from "../errors/http-error";

const talentUserService = new TalentUserService();

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
        data: newTalent,
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
        data: talent,
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
        data: talents,
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
        data: talent,
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
        data: updatedTalent,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }
}
