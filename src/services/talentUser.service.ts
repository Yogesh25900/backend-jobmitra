import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { CreateTalentDTO, LoginTalentDTO, UpdateTalentDTO, SendPasswordResetOtpDTO, VerifyOTPDTO, ResetPasswordDTO, VerifyOtpAndResetPasswordDTO } from "../dtos/talentUser.dto";
import { TalentUserModel } from "../models/talentUser_model";
import { HttpError } from "../errors/http-error";
import { GOOGLE_CLIENT_ID, JWT_SECRET } from "../config";
import { TalentUserRepository } from "../repositories/talentUser.repository";
import { MailService } from "./mail/mail.service";
import { MailType } from "./mail/mail.types";
import { getMailTemplate } from "./mail/mail.templates";
import { notifyAdminOnNewTalent } from "./notification.service";

let talentUserRepository = new TalentUserRepository();
const googleClient = new OAuth2Client();

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
  private signTalentToken(talent: {
    _id: unknown;
    email: string;
    fname?: string;
    lname?: string;
    role?: string;
  }) {
    const payload = {
      id: talent._id,
      email: talent.email,
      fname: talent.fname,
      lname: talent.lname,
      role: talent.role,
    };

    return jwt.sign(payload, JWT_SECRET as string, { expiresIn: "24h" });
  }

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
    
    // Notify admin about new talent registration
    if (newTalent?._id) {
      await notifyAdminOnNewTalent(newTalent._id.toString());
    }
    
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

    const token = this.signTalentToken(talent);
    return { token, talent };
  }

  async googleLoginTalent(credential: string) {
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

    const firstName = payload?.given_name || payload?.name?.split(" ")[0] || "Google";
    const lastName = payload?.family_name || payload?.name?.split(" ").slice(1).join(" ") || "User";
    const googleProfilePicture = payload?.picture || "";

    const talentByGoogleId = await talentUserRepository.getTalentByGoogleId(googleId);
    if (talentByGoogleId) {
      const token = this.signTalentToken(talentByGoogleId);
      return { token, talent: talentByGoogleId, isNewUser: false };
    }

    const existingTalentByEmail = await talentUserRepository.getTalentByEmail(email);
    if (existingTalentByEmail) {
      if (existingTalentByEmail.googleId && existingTalentByEmail.googleId !== googleId) {
        throw new HttpError(409, "Email already linked to another Google account");
      }

      const linkedTalent = await talentUserRepository.updateTalent(existingTalentByEmail._id.toString(), {
        googleId,
        googleProfilePicture,
        role: "candidate",
        fname: existingTalentByEmail.fname || firstName,
        lname: existingTalentByEmail.lname || lastName,
      } as any);

      if (!linkedTalent) {
        throw new HttpError(500, "Failed to link Google account");
      }

      const token = this.signTalentToken(linkedTalent);
      return { token, talent: linkedTalent, isNewUser: false };
    }

    try {
      const newTalent = await talentUserRepository.createTalent({
        googleId,
        email,
        fname: firstName,
        lname: lastName,
        googleProfilePicture,
        role: "candidate",
      } as any);

      const token = this.signTalentToken(newTalent);
      return { token, talent: newTalent, isNewUser: true };
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new HttpError(409, "Email already in use");
      }
      throw error;
    }
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
      throw new HttpError(404, "This email is not registered.");
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

    console.log("OTP generated and hashed for:", data.email);

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

  otpStore.delete(data.email); 

  return {
    message: "Password reset successfully",
  };
}

}
