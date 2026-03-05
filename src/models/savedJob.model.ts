import mongoose, { Schema, Document } from "mongoose";

export interface SavedJobType {
  talentUserId: string;
  jobId: string;
  savedAt: Date;
}

export interface SavedJobDocument extends SavedJobType, Document {}

const SavedJobSchemaMongoose = new Schema<SavedJobDocument>(
  {
    talentUserId: {
      type: String,
      ref: "TalentUser",
      required: true,
      index: true,
    },
    jobId: {
      type: String,
      ref: "Job",
      required: true,
      index: true,
    },
    savedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

SavedJobSchemaMongoose.index({ talentUserId: 1, jobId: 1 }, { unique: true });

export const SavedJobModel =
  mongoose.models.SavedJob ||
  mongoose.model<SavedJobDocument>("SavedJob", SavedJobSchemaMongoose);
