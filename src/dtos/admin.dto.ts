import { z } from "zod";
import { AdminUserSchema } from "../types/Admin.type";
import { profile } from "console";

export const createAdminDto = AdminUserSchema.pick({
  email: true,
  password: true,
}).extend({
  confirmPassword: z.string().min(6, "Confirm password is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const loginAdminDto = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

const baseUserDataSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  // For talent users
  fname: z.string().optional(),
  lname: z.string().optional(),
  phoneNumber: z.string().optional(),
  profilePicturePath: z.string().optional(),
  // For employer users
  companyName: z.string().optional(),
  contactName: z.string().optional(),
  logoPath: z.string().optional(),
}).refine((data) => {
  // Ensure required fields based on userType are present
  return true; // Will be validated in controller
});

export const createUserByAdminDto = z.preprocess(
  (input) => {
    if (input && typeof input === "object") {
      const data = input as Record<string, any>;
      if (!data.userData) {
        const { userType, ...rest } = data;
        return { userType, userData: rest };
      }
    }
    return input;
  },
  z.object({
    userType: z.enum(["employer", "talent"]),
    userData: baseUserDataSchema,
  })
);

export type CreateAdminDTO = z.infer<typeof createAdminDto>;
export type LoginAdminDTO = z.infer<typeof loginAdminDto>;
export type CreateUserByAdminDTO = z.infer<typeof createUserByAdminDto>;
