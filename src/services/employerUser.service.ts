import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { CreateEmployerDTO, LoginEmployerDTO, SendPasswordResetOtpDTO, VerifyOTPDTO, ResetPasswordDTO, VerifyOtpAndResetPasswordDTO } from "../dtos/employerUser.dto";
import { EmployerUserModel } from "../models/employerUser.model";
import { HttpError } from "../errors/http-error";
import { GOOGLE_CLIENT_ID, JWT_SECRET } from "../config";
import { EmployerUserRepository } from "../repositories/employerUser.repository";
import { MailService } from "./mail/mail.service";
import { MailType } from "./mail/mail.types";
import { getMailTemplate } from "./mail/mail.templates";

let employerUserRepository = new EmployerUserRepository();
const googleClient = new OAuth2Client();

type OtpRecord = {
  otp: string;
  expiresAt: number;
  type: "employer";
};

const otpStore = new Map<string, OtpRecord>();

const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const hashOTP = async (otp: string): Promise<string> => {
  return await bcryptjs.hash(otp, 10);
};

const compareOTP = async (plainOtp: string, hashedOtp: string): Promise<boolean> => {
  return await bcryptjs.compare(plainOtp, hashedOtp);
};

export class EmployerUserService {
  private signEmployerToken(employer: {
    _id: unknown;
    email: string;
    companyName?: string;
    role?: string;
  }) {
    const payload = {
      id: employer._id,
      email: employer.email,
      companyName: employer.companyName,
      role: employer.role,
    };

    return jwt.sign(payload, JWT_SECRET as string, { expiresIn: "24h" });
  }

  async registerEmployer(employerData: CreateEmployerDTO) {
    const checkEmail = await employerUserRepository.getEmployerByEmail(employerData.email);
    if (checkEmail) {
      throw new HttpError(409, "Email already in use");
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(employerData.password, 10);
    employerData.password = hashedPassword;

    // Remove confirmPassword before saving
    const { confirmPassword, ...dataToSave } = employerData;

    const newEmployer = await employerUserRepository.createEmployer(dataToSave);
    return newEmployer;
  }

  // Login employer
  async loginEmployer(loginData: LoginEmployerDTO) {
    const employer = await employerUserRepository.getEmployerByEmail(loginData.email);
    if (!employer) {
      throw new HttpError(404, "User not found");
    }

    const validPassword = await bcryptjs.compare(loginData.password, employer.password || "");
    if (!validPassword) {
      throw new HttpError(401, "Invalid credentials");
    }

    const token = this.signEmployerToken(employer);
    return { token, employer };
  }

  async googleLoginEmployer(credential: string) {
    if (!GOOGLE_CLIENT_ID) {
      throw new HttpError(500, "Google client ID is not configured");
    }

    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });
    } catch {
      throw new HttpError(401, "Invalid Google credential");
    }

    const payload = ticket.getPayload();
    const googleId = payload?.sub;
    const email = payload?.email?.toLowerCase();

    if (!googleId || !email) {
      throw new HttpError(400, "Invalid Google credential");
    }

    const companyName = payload?.name || email.split("@")[0] || "Employer";
    const contactName = payload?.name || "";
    const googleProfilePicture = payload?.picture || "";

    const employerByGoogleId = await employerUserRepository.getEmployerByGoogleId(googleId);
    if (employerByGoogleId) {
      const token = this.signEmployerToken(employerByGoogleId);
      return { token, employer: employerByGoogleId, isNewUser: false };
    }

    const existingEmployerByEmail = await employerUserRepository.getEmployerByEmail(email);
    if (existingEmployerByEmail) {
      if (existingEmployerByEmail.googleId && existingEmployerByEmail.googleId !== googleId) {
        throw new HttpError(409, "Email already linked to another Google account");
      }

      const linkedEmployer = await employerUserRepository.updateEmployer(existingEmployerByEmail._id.toString(), {
        googleId,
        googleProfilePicture,
        role: "employer",
        companyName: existingEmployerByEmail.companyName || companyName,
        contactName: existingEmployerByEmail.contactName || contactName,
        contactEmail: existingEmployerByEmail.contactEmail || email,
      } as any);

      if (!linkedEmployer) {
        throw new HttpError(500, "Failed to link Google account");
      }

      const token = this.signEmployerToken(linkedEmployer);
      return { token, employer: linkedEmployer, isNewUser: false };
    }

    const randomPassword = await bcryptjs.hash(`${googleId}-${Date.now()}`, 10);

    try {
      const newEmployer = await employerUserRepository.createEmployer({
        companyName,
        email,
        password: randomPassword,
        googleId,
        googleProfilePicture,
        contactName,
        contactEmail: email,
        role: "employer",
      } as any);

      const token = this.signEmployerToken(newEmployer);
      return { token, employer: newEmployer, isNewUser: true };
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new HttpError(409, "Email already in use");
      }
      throw error;
    }
  }

  // Get all employers
  async getAllEmployers() {
    return await employerUserRepository.getAllEmployers();
  }

  // Get employer by ID
  async getEmployerById(id: string) {
    const employer = await employerUserRepository.getEmployerById(id);
    if (!employer) throw new HttpError(404, "Employer not found");
    return employer;
  }

  // Update employer
  async updateEmployer(id: string, updates: Partial<CreateEmployerDTO>) {
    if (updates.password) {
      updates.password = await bcryptjs.hash(updates.password, 10);
    }
    const updatedEmployer = await employerUserRepository.updateEmployer(id, updates);
    if (!updatedEmployer) throw new HttpError(404, "Employer not found");
    return updatedEmployer;
  }

  // Send password reset OTP
  async sendPasswordResetOtp(data: SendPasswordResetOtpDTO) {
    // Check if email exists
    const employer = await employerUserRepository.getEmployerByEmail(data.email);
    if (!employer) {
      throw new HttpError(404, "This email is not registered.");
    }

    // Generate OTP
    const otp = generateOTP();
    const hashedOtp = await hashOTP(otp);
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store hashed OTP
    otpStore.set(data.email, {
      otp: hashedOtp,
      expiresAt,
      type: "employer",
    });

    console.log("OTP generated and hashed for employer:", data.email);

    // Send plain OTP via email
    const mailTemplate = getMailTemplate(MailType.PASSWORD_RESET_OTP, { otp });
    await MailService.sendMail({
      to: data.email,
      subject: mailTemplate.subject,
      html: mailTemplate.html,
    });

    return {
      message: "OTP sent to your email",
      email: data.email,
    };
  }

  // Verify OTP without resetting password
  async verifyOTP(data: VerifyOTPDTO) {
    // Check if email exists
    const employer = await employerUserRepository.getEmployerByEmail(data.email);
    if (!employer) {
      throw new HttpError(404, "Email not found");
    }

    const record = otpStore.get(data.email);
    if (!record) {
      throw new HttpError(400, "OTP not found or expired");
    }

    // Check expiration
    if (Date.now() > record.expiresAt) {
      otpStore.delete(data.email);
      throw new HttpError(400, "OTP has expired");
    }

    // Compare plain OTP with hashed OTP
    const isValidOtp = await compareOTP(data.otp, record.otp);
    if (!isValidOtp) {
      throw new HttpError(400, "Invalid OTP");
    }

    // OTP is valid, but DO NOT delete it yet
    return {
      message: "OTP verified successfully",
      email: data.email,
    };
  }

  // Reset password (assumes OTP is already verified)
  async resetPassword(data: ResetPasswordDTO) {
    // Check if email exists
    const employer = await employerUserRepository.getEmployerByEmail(data.email);
    if (!employer) {
      throw new HttpError(404, "Email not found");
    }

    // Verify OTP is still in store and valid
    const record = otpStore.get(data.email);
    if (!record) {
      throw new HttpError(400, "OTP verification required. Please verify OTP first.");
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(data.email);
      throw new HttpError(400, "OTP has expired. Please request a new OTP.");
    }

    // Hash new password
    const hashedPassword = await bcryptjs.hash(data.newPassword, 10);

    // Update password
    await employerUserRepository.updateEmployer(employer._id.toString(), {
      password: hashedPassword,
    } as any);

    // Clean up OTP from store
    otpStore.delete(data.email);

    return {
      message: "Password reset successfully",
    };
  }

  // Verify OTP and reset password (backward compatibility)
  async verifyOtpAndResetPassword(data: VerifyOtpAndResetPasswordDTO) {
    // Check if email exists
    const employer = await employerUserRepository.getEmployerByEmail(data.email);
    if (!employer) {
      throw new HttpError(404, "Email not found");
    }

    const record = otpStore.get(data.email);
    if (!record) {
      throw new HttpError(400, "OTP not found or expired");
    }

    // Check expiration
    if (Date.now() > record.expiresAt) {
      otpStore.delete(data.email);
      throw new HttpError(400, "OTP has expired");
    }

    // Compare plain OTP with hashed OTP
    const isValidOtp = await compareOTP(data.otp, record.otp);
    if (!isValidOtp) {
      throw new HttpError(400, "Invalid OTP");
    }

    // Hash new password
    const hashedPassword = await bcryptjs.hash(data.newPassword, 10);

    // Update password
    await employerUserRepository.updateEmployer(employer._id.toString(), {
      password: hashedPassword,
    } as any);

    // Clean up OTP from store
    otpStore.delete(data.email);

    return {
      message: "Password reset successfully",
    };
  }
}
