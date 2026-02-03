import bcrypt from "bcryptjs";
import { AdminUserModel } from "../models/AdminUser.model";


export const seedAdminUser = async () => {
  try {
    // Check if admin user already exists
    const existingAdmin = await AdminUserModel.findOne({
      email: process.env.ADMIN_EMAIL || "admin@jobmitra.com",
    });

    if (existingAdmin) {
      console.log("Admin user already exists");
      return;
    }

    // Default admin credentials from env or fallback
    const adminEmail = process.env.ADMIN_EMAIL || "admin@jobmitra.com";
    const adminPassword =
      process.env.ADMIN_PASSWORD || "123456";

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create admin user
    const newAdmin = new AdminUserModel({
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
    });

    await newAdmin.save();

    console.log(
      `Admin user created successfully with email: ${adminEmail}`
    );
    console.log("Make sure to change the default password in production!");
  } catch (error) {
    console.error("Error seeding admin user:", error);
    throw error;
  }
};
