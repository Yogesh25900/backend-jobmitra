import { z } from "zod";
import { TalentUserSchema } from "../types/TalentUser.type";


export const createTalentDto = TalentUserSchema.pick({
  fname: true,
  lname: true,
  email: true,
  password: true,
  phoneNumber: true,
 
}).extend({
  confirmPassword: z.string().min(6, "Confirm password is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});



export const updateTalentDto = TalentUserSchema.partial().extend({
  confirmPassword: z.string().min(6).optional(),
}).refine((data) => {
  if (data.password || data.confirmPassword) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Passwords do not match",
});


export const loginTalentDto = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export type UpdateTalentDTO = z.infer<typeof updateTalentDto>;

export type CreateTalentDTO = z.infer<typeof createTalentDto>;

export type LoginTalentDTO = z.infer<typeof loginTalentDto>;
