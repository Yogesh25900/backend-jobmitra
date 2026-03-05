import { z } from "zod";

export const AdminUserSchema = z.object({
  fname: z.string().min(2).optional(),
  lname: z.string().min(2).optional(),
  email: z.string().email(),
  phoneNumber: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  password: z.string().min(6),
  role: z.literal("admin").default("admin"),
});

export type AdminUserType = z.infer<typeof AdminUserSchema>;
