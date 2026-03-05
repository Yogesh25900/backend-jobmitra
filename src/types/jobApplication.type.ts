import { z } from "zod";

export const JobApplicationSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
  talentId: z.string().min(1, "Talent ID is required"),
  employerId: z.string().min(1, "Employer ID is required"),
  
  // Step 1: Personal Information
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Valid email is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  currentLocation: z.string().min(1, "Current location is required"),
  
  // Step 2: Professional Details
  currentJobTitle: z.string().min(1, "Current job title is required"),
  yearsOfExperience: z.number().min(0, "Years of experience must be positive"),
  currentCompany: z.string().min(1, "Current company is required"),
  noticePeriod: z.string().min(1, "Notice period is required"),
  expectedSalary: z.string().optional(),
  
  // Step 3: Skills & Qualifications
  keySkills: z.array(z.string()).min(1, "At least one skill is required"),
  highestQualification: z.string().min(1, "Highest qualification is required"),
  relevantCertifications: z.array(z.string()).optional(),
  
  // Step 4: Documents & Additional Info
  resumePath: z.string().min(1, "Resume is required"),
  coverLetterPath: z.string().optional(),
  coverLetter: z.string().optional(),
  portfolioUrl: z.string().url().optional().or(z.literal("")),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  githubUrl: z.string().url().optional().or(z.literal("")),
  
  status: z.enum(["Pending", "Reviewing", "Shortlisted", "Rejected", "Accepted"]).optional(),
});

export type JobApplicationType = z.infer<typeof JobApplicationSchema>;
export const GetApplicationsDto = z.object({
  page: z.number().positive().default(1),
  size: z.number().positive().default(5),
  status: z.enum(["Pending", "Reviewing", "Shortlisted", "Rejected", "Accepted"]).optional(),
  searchQuery: z.string().optional(), // Search by job title, company, or applicant name
  sortBy: z.enum(["appliedAt", "status", "fullName"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type GetApplicationsDTO = z.infer<typeof GetApplicationsDto>;