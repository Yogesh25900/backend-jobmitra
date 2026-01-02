import { z } from "zod";

// Nested schemas
const SocialLinksSchema = z.object({
  linkedin: z.string().optional().default(""),
  facebook: z.string().optional().default(""),
  twitter: z.string().optional().default(""),
});

// Employer User schema
export const EmployerUserSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters long"),
  email: z.email(),
  password: z.string().min(3),
  phoneNumber: z.string().optional(),
  
  website: z.string().optional().default(""),
  industry: z.string().optional().default(""),
  location: z.string().optional().default(""),
  companySize: z.string().optional().default(""),
  description: z.string().optional().default(""),
  contactName: z.string().optional().default(""),
  contactEmail: z.string().optional().default(""),
  logoPath: z.string().optional().default(""),
  role: z.enum(["employer"]).default("employer"),
  
  socialLinks: SocialLinksSchema.optional().default(() => ({ linkedin: "", facebook: "", twitter: "" })),
  
  isEmailVerified: z.boolean().optional().default(false),
  googleId: z.string().optional(),
  googleProfilePicture: z.string().optional().default(""),
  
  createdAt: z.date().optional().default(() => new Date()),
});

// TypeScript type
export type EmployerUserType = z.infer<typeof EmployerUserSchema>;
