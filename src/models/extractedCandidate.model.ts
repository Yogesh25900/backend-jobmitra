import mongoose, { Schema, Document } from "mongoose";

const extractedCandidateSchema: Schema = new Schema({
  candidateId: { type: String, required: true, unique: true },
  name: { type: String, default: "Unknown" },
  email: { type: String, default: "" },
  phone: { type: String, default: "" },
  skills: { type: [String], default: [] },
  raw_text: { type: String, default: "" },
  cvPath: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

export interface IExtractedCandidate extends Document {
  candidateId: string;
  name: string;
  email: string;
  phone: string;
  skills: string[];
  raw_text: string;
  cvPath: string;
  createdAt: Date;
}

export const ExtractedCandidateModel = mongoose.model<IExtractedCandidate>(
  "ExtractedCandidate",
  extractedCandidateSchema
);
