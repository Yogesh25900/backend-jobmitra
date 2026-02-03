import { AdminUserModel, IAdminUser } from "../../models/AdminUser.model";

export interface IAdminUserRepository {
  createAdmin(adminData: Partial<IAdminUser>): Promise<IAdminUser>;
  getAdminByEmail(email: string): Promise<IAdminUser | null>;
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
}
