import { Request, Response } from "express";

import z from "zod";
import { EmployerUserService } from "../services/employerUser.service";
import { createEmployerDto, loginEmployerDto } from "../dtos/employerUser.dto";
import { HttpError } from "../errors/http-error";

const employerUserService = new EmployerUserService();

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
        data: newEmployer,
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
        data: employer,
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
        data: employers,
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
        data: employer,
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
      const updatedEmployer = await employerUserService.updateEmployer(req.params.id, req.body);
      return res.status(200).json({
        success: true,
        message: "Employer updated successfully",
        data: updatedEmployer,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }
}
