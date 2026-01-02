import { IEmployerUser, EmployerUserModel } from "../models/employerUser_model";

export interface IEmployerUserRepository {
  createEmployer(employerData: Partial<IEmployerUser>): Promise<IEmployerUser>;
  getEmployerByEmail(email: string): Promise<IEmployerUser | null>;
  getEmployerById(id: string): Promise<IEmployerUser | null>;
  getAllEmployers(): Promise<IEmployerUser[]>;
  updateEmployer(id: string, updateData: Partial<IEmployerUser>): Promise<IEmployerUser | null>;
  deleteEmployer(id: string): Promise<boolean>;
}

export class EmployerUserRepository implements IEmployerUserRepository {
  async createEmployer(employerData: Partial<IEmployerUser>): Promise<IEmployerUser> {
    const employer = new EmployerUserModel(employerData);
    await employer.save();
    return employer;
  }

  async getEmployerByEmail(email: string): Promise<IEmployerUser | null> {
    return await EmployerUserModel.findOne({ email });
  }

  async getEmployerById(id: string): Promise<IEmployerUser | null> {
    return await EmployerUserModel.findById(id);
  }

  async getAllEmployers(): Promise<IEmployerUser[]> {
    return await EmployerUserModel.find();
  }

  async updateEmployer(id: string, updateData: Partial<IEmployerUser>): Promise<IEmployerUser | null> {
    return await EmployerUserModel.findByIdAndUpdate(id, updateData, { new: true });
  }

  async deleteEmployer(id: string): Promise<boolean> {
    const result = await EmployerUserModel.findByIdAndDelete(id);
    return result ? true : false;
  }
}
