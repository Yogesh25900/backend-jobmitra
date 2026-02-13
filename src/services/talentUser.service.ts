import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { CreateTalentDTO, LoginTalentDTO, UpdateTalentDTO, SendPasswordResetOtpDTO, VerifyOTPDTO, ResetPasswordDTO, VerifyOtpAndResetPasswordDTO } from "../dtos/talentUser.dto";
import { TalentUserModel } from "../models/talentUser_model";
import { HttpError } from "../errors/http-error";
import { JWT_SECRET } from "../config";
import { TalentUserRepository } from "../repositories/talentUser.repository";
import { MailService } from "./mail/mail.service";
import { MailType } from "./mail/mail.types";
import { getMailTemplate } from "./mail/mail.templates";
import { ta } from "zod/v4/locales";

let talentUserRepository = new TalentUserRepository();

type OtpRecord = {
  otp: string;
  expiresAt: number;
  type: "talent";
};

const otpStore = new Map<string, OtpRecord>();

// Helper function to generate OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper function to hash OTP
const hashOTP = async (otp: string): Promise<string> => {
  return await bcryptjs.hash(otp, 10);
};

// Helper function to compare OTP
const compareOTP = async (plainOtp: string, hashedOtp: string): Promise<boolean> => {
  return await bcryptjs.compare(plainOtp, hashedOtp);
};

export class TalentUserService {
  // Register a new talent
  async registerTalent(talentData: CreateTalentDTO) {
    // Check if email already exists
    const checkEmail = await talentUserRepository.getTalentByEmail(talentData.email);
    if (checkEmail) {
      throw new HttpError(409, "Email already in use");
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(talentData.password, 10);
    talentData.password = hashedPassword;

    // Remove confirmPassword before saving
    const { confirmPassword, ...dataToSave } = talentData;

    const newTalent = await talentUserRepository.createTalent(dataToSave);
    return newTalent;
  }

  // Login talent
  async loginTalent(loginData: LoginTalentDTO) {
    const talent = await talentUserRepository.getTalentByEmail(loginData.email);
    if (!talent) {
      throw new HttpError(404, "User  not found");
    }

    const validPassword = await bcryptjs.compare(loginData.password, talent.password || "");
    if (!validPassword) {
      throw new HttpError(401, "Invalid credentials");
    }

    const payload = {
      id: talent._id,
      email: talent.email,
      fname: talent.fname,
      lname: talent.lname,
      role: talent.role,
    };

    const token = jwt.sign(payload, JWT_SECRET as string, { expiresIn: "24h" });
    return { token, talent };
  }

  // Get all talents
  async getAllTalents() {
    return await talentUserRepository.getAllTalents();
  }

  // Get talent by ID
  async getTalentById(id: string) {
    const talent = await talentUserRepository.getTalentById(id);
    if (!talent) throw new HttpError(404, "Talent user not found");
    return talent;
  }

  // Update talent
  async updateTalent(id: string, updates: UpdateTalentDTO) {
    // Hash password if it's being updated
    if (updates.password) {
      updates.password = await bcryptjs.hash(updates.password, 10);
    }

    // profilePicturePath is optional — just keep it as-is if provided
    // No extra code needed here unless you want to validate filename

    const updatedTalent = await talentUserRepository.updateTalent(id, updates);

    if (!updatedTalent) throw new HttpError(404, "Talent user not found");

    return updatedTalent;
  }


  // Send password reset OTP
  async sendPasswordResetOtp(data: SendPasswordResetOtpDTO) {
    const talent = await talentUserRepository.getTalentByEmail(data.email);
    if (!talent) {
      throw new HttpError(404, "Email not found");
    }

    const otp = generateOTP();
    const hashedOtp = await hashOTP(otp);
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store both hashed OTP and expiry time
    otpStore.set(data.email, {
      otp: hashedOtp,
      expiresAt,
      type: "talent",
    });

    console.log("✅ OTP generated and hashed for:", data.email);

    // Send plain OTP via email (user will see actual OTP, not hash)
    const mailTemplate = getMailTemplate(
      MailType.PASSWORD_RESET_OTP,
      { otp }
    );

    await MailService.sendMail({
      to: data.email,
      subject: mailTemplate.subject,
      html: mailTemplate.html,
    });

    return {
      message: "OTP sent to your email",
    };
  }

  // Verify OTP without resetting password
  async verifyOTP(data: VerifyOTPDTO) {
    const talent = await talentUserRepository.getTalentByEmail(data.email);
    if (!talent) {
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

    // OTP is valid, but DO NOT delete it yet - user will use it in next step
    // The OTP remains in otpStore until password reset is complete
    return {
      message: "OTP verified successfully",
      email: data.email,
    };
  }

  // Reset password (assumes OTP is already verified)
  async resetPassword(data: ResetPasswordDTO) {
    const talent = await talentUserRepository.getTalentByEmail(data.email);
    if (!talent) {
      throw new HttpError(404, "Email not found");
    }

    // Verify OTP is still in store and valid (prevents direct password reset without verification)
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
    await talentUserRepository.updateTalent(talent._id.toString(), {
      password: hashedPassword,
    });

    // Clean up OTP from store
    otpStore.delete(data.email);

    return {
      message: "Password reset successfully",
    };
  }


  // Backward compatibility: Combined OTP verification and password reset
  async verifyOtpAndResetPassword(data: VerifyOtpAndResetPasswordDTO) {
  const talent = await talentUserRepository.getTalentByEmail(data.email);
  if (!talent) {
    throw new HttpError(404, "Email not found");
  }

  const record = otpStore.get(data.email);
  if (!record) {
    throw new HttpError(400, "OTP not found or expired");
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(data.email);
    throw new HttpError(400, "OTP has expired");
  }

  // Compare plain OTP with hashed OTP
  const isValidOtp = await compareOTP(data.otp, record.otp);
  if (!isValidOtp) {
    throw new HttpError(400, "Invalid OTP");
  }

  const hashedPassword = await bcryptjs.hash(data.newPassword, 10);

  await talentUserRepository.updateTalent(talent._id.toString(), {
    password: hashedPassword,
  });

  otpStore.delete(data.email); // ✅ IMPORTANT

  return {
    message: "Password reset successfully",
  };
}

}
