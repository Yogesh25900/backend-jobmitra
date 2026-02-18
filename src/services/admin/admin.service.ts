import { HttpError } from "../../errors/http-error";
import { IAdminUser } from "../../models/AdminUser.model";
import { AdminUserRepository } from "../../repositories/admin/adminUser.repository";
import { EmployerUserRepository } from "../../repositories/employerUser.repository";
import { TalentUserRepository } from "../../repositories/talentUser.repository";
import bcryptjs from "bcryptjs";
import { EmployerUserModel } from "../../models/employerUser.model";
import { TalentUserModel } from "../../models/talentUser_model";

const employerRepository = new EmployerUserRepository();
const talentRepository = new TalentUserRepository();
const adminRepository = new AdminUserRepository();

export class AdminService {

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

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

  async getAdminById(id: string) {
    const admin = await adminRepository.getAdminById(id);
    if (!admin) {
      throw new HttpError(404, "Admin not found.");
    }
    return admin;
  }

  async updateAdminProfile(adminId: string, updates: {
    fname?: string;
    lname?: string;
    email?: string;
    phoneNumber?: string;
    location?: string;
  }) {
    const admin = await adminRepository.getAdminById(adminId);
    if (!admin) {
      throw new HttpError(404, "Admin not found.");
    }

    if (updates.email && updates.email !== admin.email) {
      const existingAdmin = await adminRepository.getAdminByEmail(updates.email);
      if (existingAdmin && existingAdmin._id.toString() !== adminId) {
        throw new HttpError(409, "Admin with this email already exists.");
      }
    }

    const updatedAdmin = await adminRepository.updateAdminById(adminId, updates);
    if (!updatedAdmin) {
      throw new HttpError(500, "Failed to update admin profile.");
    }
    return updatedAdmin;
  }

  async changeAdminPassword(adminId: string, currentPassword: string, newPassword: string) {
    const admin = await adminRepository.getAdminById(adminId);
    if (!admin) {
      throw new HttpError(404, "Admin not found.");
    }

    const isPasswordValid = await bcryptjs.compare(currentPassword, admin.password);
    if (!isPasswordValid) {
      throw new HttpError(401, "Current password is incorrect.");
    }

    const hashedPassword = await bcryptjs.hash(newPassword, 10);
    const updatedAdmin = await adminRepository.updateAdminById(adminId, { password: hashedPassword });

    if (!updatedAdmin) {
      throw new HttpError(500, "Failed to change password.");
    }

    return true;
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

    async getAllUsers(page: number = 1, size: number = 5, search?: string, role?: string) {
    try {
      const safePage = Math.max(1, page);
      const safeSize = Math.max(1, size);
      const skip = (safePage - 1) * safeSize;
      const trimmedSearch = (search || "").trim();
      const normalizedRole = (role || "").trim().toLowerCase();
      const hasRoleFilter = normalizedRole !== "" && normalizedRole !== "all";

      const pipeline: any[] = [
        {
          $project: {
            _id: 1,
            email: 1,
            role: { $ifNull: ["$role", "employer"] },
            createdAt: 1,
            updatedAt: 1,
            companyName: 1,
            contactName: 1,
            phoneNumber: 1,
            location: 1,
            logoPath: 1,
            profilePicturePath: 1,
            fname: { $literal: null },
            lname: { $literal: null },
            searchableName: {
              $trim: {
                input: {
                  $ifNull: ["$companyName", { $ifNull: ["$contactName", ""] }],
                },
              },
            },
          },
        },
        {
          $unionWith: {
            coll: TalentUserModel.collection.name,
            pipeline: [
              {
                $project: {
                  _id: 1,
                  email: 1,
                  role: { $ifNull: ["$role", "candidate"] },
                  createdAt: 1,
                  updatedAt: 1,
                  companyName: { $literal: null },
                  contactName: { $literal: null },
                  phoneNumber: 1,
                  location: 1,
                  logoPath: { $literal: null },
                  profilePicturePath: 1,
                  fname: 1,
                  lname: 1,
                  searchableName: {
                    $trim: {
                      input: {
                        $concat: [
                          { $ifNull: ["$fname", ""] },
                          " ",
                          { $ifNull: ["$lname", ""] },
                        ],
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      ];

      if (hasRoleFilter) {
        pipeline.push({ $match: { role: normalizedRole } });
      }

      if (trimmedSearch) {
        const searchRegex = this.escapeRegex(trimmedSearch);
        pipeline.push({
          $match: {
            $or: [
              { email: { $regex: searchRegex, $options: "i" } },
              { searchableName: { $regex: searchRegex, $options: "i" } },
              { companyName: { $regex: searchRegex, $options: "i" } },
              { contactName: { $regex: searchRegex, $options: "i" } },
              { fname: { $regex: searchRegex, $options: "i" } },
              { lname: { $regex: searchRegex, $options: "i" } },
            ],
          },
        });
      }

      pipeline.push(
        { $sort: { createdAt: -1, _id: -1 } },
        {
          $facet: {
            data: [{ $skip: skip }, { $limit: safeSize }],
            metadata: [{ $count: "total" }],
          },
        }
      );

      const [result] = await EmployerUserModel.aggregate(pipeline);
      const users = result?.data || [];
      const total = result?.metadata?.[0]?.total || 0;
      const totalPages = Math.ceil(total / safeSize);

      return {
        data: users,
        metadata: {
          total,
          page: safePage,
          size: safeSize,
          totalPages,
        },
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