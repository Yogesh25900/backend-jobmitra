import { AdminUserModel, IAdminUser } from "../../models/AdminUser.model";

export interface IAdminUserRepository {
  createAdmin(adminData: Partial<IAdminUser>): Promise<IAdminUser>;
  getAdminByEmail(email: string): Promise<IAdminUser | null>;
  getAdminById(id: string): Promise<IAdminUser | null>;
  updateAdminById(id: string, updates: Partial<IAdminUser>): Promise<IAdminUser | null>;
}

export class AdminUserRepository implements IAdminUserRepository {
  async createAdmin(adminData: Partial<IAdminUser>): Promise<IAdminUser> {
    const admin = new AdminUserModel(adminData);
    await admin.save();
    return admin;
  }

  async getAdminByEmail(email: string): Promise<IAdminUser | null> {
    return await AdminUserModel.findOne({ email });
  }

  async getAdminById(id: string): Promise<IAdminUser | null> {
    return await AdminUserModel.findById(id);
  }

  async updateAdminById(id: string, updates: Partial<IAdminUser>): Promise<IAdminUser | null> {
    return await AdminUserModel.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
  }
}
