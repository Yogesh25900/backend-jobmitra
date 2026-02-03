import { z } from "zod";

export const AdminUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.literal("admin").default("admin"),
});

export type AdminUserType = z.infer<typeof AdminUserSchema>;
