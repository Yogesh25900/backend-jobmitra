import mongoose, { Schema, Document } from "mongoose";

export interface JobApplicationDocument extends Document {
  jobId: string;
  talentId: string;
  employerId: string;
  
  fullName: string;
  email: string;
  phoneNumber: string;
  currentLocation: string;
  
  currentJobTitle: string;
  yearsOfExperience: number;
  currentCompany: string;
  noticePeriod: string;
  expectedSalary?: string;
  
  keySkills: string[];
  highestQualification: string;
  relevantCertifications: string[];
  
  resumePath: string;
  coverLetterPath?: string;
  coverLetter?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  
  status: "Pending" | "Reviewing" | "Shortlisted" | "Rejected" | "Accepted";
  appliedAt: Date;
  updatedAt: Date;
}

const JobApplicationSchema = new Schema<JobApplicationDocument>(
  {
    jobId: {
      type: String,
      ref: "Job",
      required: true,
    },
    talentId: {
      type: String,
      ref: "TalentUser",
      required: true,
    },
    employerId: {
      type: String,
      ref: "EmployerUser",
      required: true,
    },
    
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    currentLocation: { type: String, required: true },
    
    currentJobTitle: { type: String, required: true },
    yearsOfExperience: { type: Number, required: true },
    currentCompany: { type: String, required: true },
    noticePeriod: { type: String, required: true },
    expectedSalary: { type: String },
    
    keySkills: { type: [String], required: true },
    highestQualification: { type: String, required: true },
    relevantCertifications: { type: [String], default: [] },
    
    resumePath: { type: String, required: true },
    coverLetterPath: { type: String },
    coverLetter: { type: String },
    portfolioUrl: { type: String },
    linkedinUrl: { type: String },
    githubUrl: { type: String },
    
    status: {
      type: String,
      enum: ["Pending", "Reviewing", "Shortlisted", "Rejected", "Accepted"],
      default: "Pending",
    },
    appliedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

JobApplicationSchema.index({ jobId: 1, talentId: 1 }, { unique: true });
JobApplicationSchema.index({ employerId: 1 });
JobApplicationSchema.index({ status: 1 });

export const JobApplicationModel =
  mongoose.models.JobApplication ||
  mongoose.model<JobApplicationDocument>("JobApplication", JobApplicationSchema);
