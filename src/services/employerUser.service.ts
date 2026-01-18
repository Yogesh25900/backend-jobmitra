import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { CreateEmployerDTO, LoginEmployerDTO } from "../dtos/employerUser.dto";
import { EmployerUserModel } from "../models/employerUser_model";
import { HttpError } from "../errors/http-error";
import { JWT_SECRET } from "../config";
import { EmployerUserRepository } from "../repositories/employerUser.repository";

let employerUserRepository = new EmployerUserRepository();
export class EmployerUserService {
  // Register a new employer
  async registerEmployer(employerData: CreateEmployerDTO) {
    // Check if email already exists
    const checkEmail = await employerUserRepository.getEmployerByEmail(employerData.email);
    if (checkEmail) {
      throw new HttpError(409, "Email already in use");
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(employerData.password, 10);
    employerData.password = hashedPassword;

    // Remove confirmPassword before saving
    const { confirmPassword, ...dataToSave } = employerData;

    const newEmployer = await employerUserRepository.createEmployer(dataToSave);
    return newEmployer;
  }

  // Login employer
  async loginEmployer(loginData: LoginEmployerDTO) {
    const employer = await employerUserRepository.getEmployerByEmail(loginData.email);
    if (!employer) {
      throw new HttpError(404, "User not found");
    }

    const validPassword = await bcryptjs.compare(loginData.password, employer.password || "");
    if (!validPassword) {
      throw new HttpError(401, "Invalid credentials");
    }

    const payload = {
      id: employer._id,
      email: employer.email,
      companyName: employer.companyName,
      role: employer.role,
    };

    const token = jwt.sign(payload, JWT_SECRET as string, { expiresIn: "1h" });
    return { token, employer };
  }

  // Get all employers
  async getAllEmployers() {
    return await employerUserRepository.getAllEmployers();
  }

  // Get employer by ID
  async getEmployerById(id: string) {
    const employer = await employerUserRepository.getEmployerById(id);
    if (!employer) throw new HttpError(404, "Employer not found");
    return employer;
  }

  // Update employer
  async updateEmployer(id: string, updates: Partial<CreateEmployerDTO>) {
    if (updates.password) {
      updates.password = await bcryptjs.hash(updates.password, 10);
    }
    const updatedEmployer = await employerUserRepository.updateEmployer(id, updates);
    if (!updatedEmployer) throw new HttpError(404, "Employer not found");
    return updatedEmployer;
  }
}
