import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { CreateTalentDTO, LoginTalentDTO,UpdateTalentDTO, } from "../dtos/talentUser.dto";
import { TalentUserModel } from "../models/talentUser_model";
import { HttpError } from "../errors/http-error";
import { JWT_SECRET } from "../config";
import { TalentUserRepository } from "../repositories/talentUser.repository";
import { ta } from "zod/v4/locales";

let talentUserRepository = new TalentUserRepository();
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

}
