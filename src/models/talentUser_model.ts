import mongoose, { Schema, Document } from "mongoose";
import { TalentUserType } from "../types/TalentUser.type";

const talentUserSchema: Schema = new Schema(
  {
    fname: { type: String },
    lname: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    phoneNumber: { type: String },
    dateOfBirth: { type: String },
    role: { type: String, enum: ["candidate"], default: "candidate" },
    profilePicturePath: { type: String, default: "" },
    cvPath: { type: String, default: "" },
    googleId: { type: String, sparse: true, unique: true },
    googleProfilePicture: { type: String, default: "" },
    location: { type: String, default: "" },
    title: { type: String, default: "" },
    summary: { type: String, default: "" },
    experiences: [
      {
        title: String,
        company: String,
        period: String,
        location: String,
        description: String,
        isCurrent: { type: Boolean, default: false },
      },
    ],
    education: [
      {
        degree: String,
        institution: String,
        period: String,
      },
    ],
    skills: { type: [String], default: [] },
    certifications: [
      {
        name: String,
        issuer: String,
      },
    ],
    portfolio: [
      {
        id: String,
        title: String,
        portfolioLink: String,
        image: String,
      },
    ],
    links: {
      linkedin: { type: String, default: "" },
      github: { type: String, default: "" },
      portfolio: { type: String, default: "" },
    },
  },
  {
    timestamps: true, // includes createdAt and updatedAt
  }
);

// Interface for TypeScript
export interface ITalentUser extends TalentUserType, Document {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const TalentUserModel = mongoose.model<ITalentUser>("TalentUser", talentUserSchema);
