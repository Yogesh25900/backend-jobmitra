import mongoose, { Schema, Document } from "mongoose";

export interface IAdminUser extends Document {
  fname?: string;
  lname?: string;
  email: string;
  phoneNumber?: string;
  location?: string;
  password: string;
  role: "admin";
  createdAt: Date;
  updatedAt: Date;
}

const adminUserSchema: Schema = new Schema(
  {
    fname: { type: String, trim: true },
    lname: { type: String, trim: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String, trim: true },
    location: { type: String, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin"], default: "admin" },
  },
  {
    timestamps: true,
  }
);

export const AdminUserModel = mongoose.model<IAdminUser>(
  "AdminUser",
  adminUserSchema
);
