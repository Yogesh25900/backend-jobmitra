import { z } from "zod";

// Nested schemas
const ExperienceSchema = z.object({
  title: z.string().optional(),
  company: z.string().optional(),
  period: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  isCurrent: z.boolean().optional().default(false),
});

const EducationSchema = z.object({
  degree: z.string().optional(),
  institution: z.string().optional(),
  period: z.string().optional(),
});

const CertificationSchema = z.object({
  name: z.string().optional(),
  issuer: z.string().optional(),
});

const PortfolioSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  portfolioLink: z.string().optional(),
  image: z.string().optional(),
});

const LinksSchema = z.object({
  linkedin: z.string().optional().default(""),
  github: z.string().optional().default(""),
  portfolio: z.string().optional().default(""),
});

// Talent User schema
export const TalentUserSchema = z.object({
  fname: z.string().min(2, "First name must be at least 2 characters long"),
  lname: z.string().min(2, "Last name must be at least 2 characters long"),
  email: z.email(),
  dateOfBirth: z.string().optional(),
  isEmailVerified: z.boolean().optional().default(false),
  password: z.string().min(3),
  phoneNumber: z.string().optional(),
  role: z.enum(["candidate", "employer"]).default("candidate"),
  profilePicturePath: z.string().optional().default(""),
  cvPath: z.string().optional().default(""),
  googleId: z.string().optional(),
  googleProfilePicture: z.string().optional().default(""),
  location: z.string().optional().default(""),
  title: z.string().optional().default(""),
  summary: z.string().optional().default(""),
  experiences: z.array(ExperienceSchema).optional().default([]),
  education: z.array(EducationSchema).optional().default([]),
  skills: z.array(z.string()).optional().default([]),
  certifications: z.array(CertificationSchema).optional().default([]),
  portfolio: z.array(PortfolioSchema).optional().default([]),
  links: LinksSchema.optional().default(() => ({ linkedin: "", github: "", portfolio: "" })),
  createdAt: z.date().optional().default(() => new Date()),
});

// TypeScript type
export type TalentUserType = z.infer<typeof TalentUserSchema>;
