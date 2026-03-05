import mongoose, { Schema, Document, Types } from "mongoose";

export interface IFeedback extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  userName: string;
  userRole: "candidate" | "employer" | "admin";
  email: string;
  subject: string;
  description: string;
  issueType: "bug" | "feature_request" | "account_issue" | "other";
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  screenshotPath?: string;
  attachmentPath?: string;
  resolutionNotes?: string;
  resolvedBy?: Types.ObjectId;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userRole: {
      type: String,
      enum: ["candidate", "employer", "admin"],
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      minlength: 5,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 5000,
    },
    issueType: {
      type: String,
      enum: ["bug", "feature_request", "account_issue", "other"],
      default: "other",
      index: true,
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
      index: true,
    },
    screenshotPath: {
      type: String,
      default: null,
    },
    attachmentPath: {
      type: String,
      default: null,
    },
    resolutionNotes: {
      type: String,
      maxlength: 2000,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

FeedbackSchema.index({ createdAt: -1 });
FeedbackSchema.index({ userId: 1, createdAt: -1 });
FeedbackSchema.index({ status: 1, createdAt: -1 });
FeedbackSchema.index({ issueType: 1, createdAt: -1 });

export const FeedbackModel =
  mongoose.models.Feedback || mongoose.model<IFeedback>("Feedback", FeedbackSchema);
