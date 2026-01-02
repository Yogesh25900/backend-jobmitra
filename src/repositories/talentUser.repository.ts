import { ITalentUser, TalentUserModel } from "../models/talentUser_model";

export interface ITalentUserRepository {
  createTalent(talentData: Partial<ITalentUser>): Promise<ITalentUser>;
  getTalentByEmail(email: string): Promise<ITalentUser | null>;
  getTalentById(id: string): Promise<ITalentUser | null>;
  getAllTalents(): Promise<ITalentUser[]>;
  updateTalent(id: string, updateData: Partial<ITalentUser>): Promise<ITalentUser | null>;
  deleteTalent(id: string): Promise<boolean>;
}

export class TalentUserRepository implements ITalentUserRepository {
  async createTalent(talentData: Partial<ITalentUser>): Promise<ITalentUser> {
    const talent = new TalentUserModel(talentData);
    await talent.save();
    return talent;
  }

  async getTalentByEmail(email: string): Promise<ITalentUser | null> {
    return await TalentUserModel.findOne({ email });
  }

  async getTalentById(id: string): Promise<ITalentUser | null> {
    return await TalentUserModel.findById(id);
  }

  async getAllTalents(): Promise<ITalentUser[]> {
    return await TalentUserModel.find();
  }

  async updateTalent(id: string, updateData: Partial<ITalentUser>): Promise<ITalentUser | null> {
    return await TalentUserModel.findByIdAndUpdate(id, updateData, { new: true });
  }

  async deleteTalent(id: string): Promise<boolean> {
    const result = await TalentUserModel.findByIdAndDelete(id);
    return result ? true : false;
  }
}
