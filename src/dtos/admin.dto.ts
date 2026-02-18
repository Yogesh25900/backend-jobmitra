import { z } from "zod";
import { AdminUserSchema } from "../types/Admin.type";

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

export const updateAdminProfileDto = z
  .object({
    fname: z.string().trim().min(2, "First name must be at least 2 characters").optional(),
    lname: z.string().trim().min(2, "Last name must be at least 2 characters").optional(),
    email: z.string().trim().email("Invalid email format").optional(),
    phoneNumber: z.string().trim().min(1, "Phone number is required").optional(),
    location: z.string().trim().min(1, "Location is required").optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: "At least one profile field is required" }
  );

export const changeAdminPasswordDto = z
  .object({
    currentPassword: z.string().min(6, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters long"),
    confirmPassword: z.string().min(6, "Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

const talentUserDataSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  fname: z.string().min(2, "First name must be at least 2 characters long"),
  lname: z.string().min(2, "Last name must be at least 2 characters long"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  profilePicturePath: z.string().optional(),
  dateOfBirth: z.string().optional(),
});

const employerUserDataSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  companyName: z.string().min(2, "Company name must be at least 2 characters long"),
  contactName: z.string().min(2, "Contact name must be at least 2 characters long"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  logoPath: z.string().optional(),
  profilePicturePath: z.string().optional(),
});

const createUserByAdminBaseDto = z.discriminatedUnion("userType", [
  z.object({
    userType: z.literal("talent"),
    userData: talentUserDataSchema,
  }),
  z.object({
    userType: z.literal("employer"),
    userData: employerUserDataSchema,
  }),
]);

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
  createUserByAdminBaseDto
);

export type CreateAdminDTO = z.infer<typeof createAdminDto>;
export type LoginAdminDTO = z.infer<typeof loginAdminDto>;
export type CreateUserByAdminDTO = z.infer<typeof createUserByAdminDto>;
export type UpdateAdminProfileDTO = z.infer<typeof updateAdminProfileDto>;
export type ChangeAdminPasswordDTO = z.infer<typeof changeAdminPasswordDto>;
