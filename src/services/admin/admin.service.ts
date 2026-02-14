import { HttpError } from "../../errors/http-error";
import { IAdminUser } from "../../models/AdminUser.model";
import { AdminUserRepository } from "../../repositories/admin/adminUser.repository";
import { EmployerUserRepository } from "../../repositories/employerUser.repository";
import { TalentUserRepository } from "../../repositories/talentUser.repository";
import bcryptjs from "bcryptjs";

const employerRepository = new EmployerUserRepository();
const talentRepository = new TalentUserRepository();
const adminRepository = new AdminUserRepository();

export class AdminService {

  async createAdmin(adminData: Partial<IAdminUser>) {
    const existingAdmin = await adminRepository.getAdminByEmail(adminData.email!);
    if (existingAdmin) {
      throw new HttpError(400, "Admin with this email already exists.");
    }
    const hashedPassword = await bcryptjs.hash(adminData.password!, 10);
   const newAdmin = await adminRepository.createAdmin({ ...adminData, password: hashedPassword,role: "admin" });
    return newAdmin;
  }

  async loginAdmin(email: string, password: string) {
    const admin = await adminRepository.getAdminByEmail(email);
    if (!admin) {
      throw new HttpError(401, "Admin not found.");
    }
    const isPasswordValid = await bcryptjs.compare(password, admin.password);
    if (!isPasswordValid) {
      throw new HttpError(401, "Invalid password.");
    }
    return admin;
  }

  async createUserAsAdmin(userType: "employer" | "talent", userData: any) {
    if (userType === "employer") {
      const existingEmployer = await employerRepository.getEmployerByEmail(userData.email);
        if (existingEmployer) {
            throw new Error("Employer with this email already exists.");
        }
      const hashedPassword = await bcryptjs.hash(userData.password, 10);
      const newEmployer = await employerRepository.createEmployer({ ...userData, password: hashedPassword });
      return newEmployer;
    } else if (userType === "talent") {
      const existingTalent = await talentRepository.getTalentByEmail(userData.email);
        if (existingTalent) {
            throw new Error("Talent with this email already exists.");
        }
        const hashedPassword = await bcryptjs.hash(userData.password, 10);
        const newTalent = await talentRepository.createTalent({ ...userData, password: hashedPassword });
        return newTalent;
    } else {
      throw new Error("Invalid user type.");
    }
    }

    async getAllUsers(page: number = 1, size: number = 5) {
    try {
      const employers = await employerRepository.getAllEmployers();
      const talents = await talentRepository.getAllTalents();

      // Combine both arrays and sort by createdAt if available
      const allUsers = [...employers, ...talents].sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      // Calculate pagination
      const total = allUsers.length;
      const totalPages = Math.ceil(total / size);
      const skip = (page - 1) * size;
      const paginatedUsers = allUsers.slice(skip, skip + size);

      return {
        data: paginatedUsers,
        metadata: {
          total,
          page,
          size,
          totalPages
        }
      };
    } catch (error: any) {
      throw new HttpError(
        error.statusCode || 500,
        error.message || "Error retrieving users"
      );
    }
  }

    async getUserById(id: string) {
    try {
      // Try to find in both collections
      const employer = await employerRepository.getEmployerById(id);
      if (employer) return employer;

      const talent = await talentRepository.getTalentById(id);
      if (talent) return talent;
      throw new HttpError(404, "User not found");
    } catch (error: any) {
      throw new HttpError(
        error.statusCode || 500,
        error.message || "Error retrieving user"
      );
    }
  }



  async updateUserById(id: string, updates: any) {
    try {
      // Try to find in both collections
      const employer = await employerRepository.getEmployerById(id);
      if (employer) {
        if (updates.password) {
          updates.password = await bcryptjs.hash(updates.password, 10);
        }
        const updatedEmployer = await employerRepository.updateEmployer(id, updates);
        return updatedEmployer;
      }
        const talent = await talentRepository.getTalentById(id);
        if (talent) {
            if (updates.password) {
                updates.password = await bcryptjs.hash(updates.password, 10);
            }
            const updatedTalent = await talentRepository.updateTalent(id, updates);
            return updatedTalent;
        }

    } catch (error: any) {
      throw new HttpError(
        error.statusCode || 500,
        error.message || "Error updating user"
      );
    }
}


    async deleteUserById(id: string) {
    try {
      // Try to find in both collections
      const employer = await employerRepository.getEmployerById(id);
      if (employer) {
        const result = await employerRepository.deleteEmployer(id);
        return result;
      }
        const talent = await talentRepository.getTalentById(id);
        if (talent) {
            const result = await talentRepository.deleteTalent(id);
            return result;
        }
        throw new HttpError(404, "User not found");
    } catch (error: any) {
      throw new HttpError(
        error.statusCode || 500,
        error.message || "Error deleting user"
      );
    }
    }
    

}