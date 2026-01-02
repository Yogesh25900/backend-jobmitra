import mongoose, { Schema, Document } from "mongoose";
import { EmployerUserType } from "../types/EmployerUser.type";

const employerUserSchema: Schema = new Schema(
  {
    companyName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phoneNumber: { type: String },
    
    website: { type: String, default: "" },
    industry: { type: String, default: "" },
    location: { type: String, default: "" },
    companySize: { type: String, default: "" },
    description: { type: String, default: "" },
    contactName: { type: String, default: "" },
    contactEmail: { type: String, default: "" },
    logoPath: { type: String, default: "" },
    role: { type: String, enum: ["employer"], default: "employer" },
    
    socialLinks: {
      linkedin: { type: String, default: "" },
      facebook: { type: String, default: "" },
      twitter: { type: String, default: "" },
    },
    
    isEmailVerified: { type: Boolean, default: false },
    googleId: { type: String, sparse: true, unique: true },
    googleProfilePicture: { type: String, default: "" },
  },
  {
    timestamps: true, // includes createdAt and updatedAt
  }
);

// Interface for TypeScript
export interface IEmployerUser extends EmployerUserType, Document {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const EmployerUserModel = mongoose.model<IEmployerUser>("EmployerUser", employerUserSchema);
