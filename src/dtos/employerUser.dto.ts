import { z } from "zod";
import { EmployerUserSchema } from "../types/EmployerUser.type";


export const createEmployerDto = EmployerUserSchema.pick({
  companyName: true,
  email: true,
  password: true,
  phoneNumber: true,
  contactName: true,
}).extend({
  confirmPassword: z.string().min(6, "Confirm password is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});



export const updateEmployerDto = EmployerUserSchema.partial().extend({
  confirmPassword: z.string().min(6).optional(),
}).refine((data) => {
  if (data.password || data.confirmPassword) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Passwords do not match",
});


export const loginEmployerDto = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

// Password reset DTOs

// Step 1: Request OTP via email
export const sendPasswordResetOtpDto = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format"),
});

// Step 2: Verify OTP (separate validation, does not reset password)
export const verifyOTPDto = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "OTP must contain only digits"),
});

// Step 3: Reset password (OTP already verified, only password submission)
export const resetPasswordDto = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  newPassword: z.string().min(6, "Password must be at least 6 characters long"),
  confirmPassword: z.string().min(6, "Confirm password is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Backward compatibility: combined DTO for single-step reset (deprecated)
export const verifyOtpAndResetPasswordDto = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "OTP must contain only digits"),
  newPassword: z.string().min(6, "Password must be at least 6 characters long"),
  confirmPassword: z.string().min(6, "Confirm password is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type UpdateEmployerDTO = z.infer<typeof updateEmployerDto>;

export type CreateEmployerDTO = z.infer<typeof createEmployerDto>;

export type LoginEmployerDTO = z.infer<typeof loginEmployerDto>;

export type SendPasswordResetOtpDTO = z.infer<typeof sendPasswordResetOtpDto>;

export type VerifyOTPDTO = z.infer<typeof verifyOTPDto>;

export type ResetPasswordDTO = z.infer<typeof resetPasswordDto>;

export type VerifyOtpAndResetPasswordDTO = z.infer<typeof verifyOtpAndResetPasswordDto>;
