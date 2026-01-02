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

export type UpdateEmployerDTO = z.infer<typeof updateEmployerDto>;

export type CreateEmployerDTO = z.infer<typeof createEmployerDto>;

export type LoginEmployerDTO = z.infer<typeof loginEmployerDto>;
