import { SavedJobDocument, SavedJobModel } from "../models/savedJob.model";

export interface ISavedJobRepository {
  addSavedJob(talentUserId: string, jobId: string): Promise<SavedJobDocument>;
  removeSavedJob(talentUserId: string, jobId: string): Promise<boolean>;
  getSavedJobIds(talentUserId: string): Promise<string[]>;
  getSavedJobs(
    talentUserId: string,
    page?: number,
    size?: number
  ): Promise<{
    data: SavedJobDocument[];
    total: number;
    page: number;
    size: number;
    totalPages: number;
  }>;
  isSaved(talentUserId: string, jobId: string): Promise<boolean>;
}

export class SavedJobRepository implements ISavedJobRepository {
  async addSavedJob(
    talentUserId: string,
    jobId: string
  ): Promise<SavedJobDocument> {
    const existing = await SavedJobModel.findOne({
      talentUserId,
      jobId,
    });

    if (existing) {
      return existing;
    }

    const savedJob = new SavedJobModel({
      talentUserId,
      jobId,
      savedAt: new Date(),
    });

    await savedJob.save();
    return savedJob;
  }

  async removeSavedJob(talentUserId: string, jobId: string): Promise<boolean> {
    const result = await SavedJobModel.findOneAndDelete({
      talentUserId,
      jobId,
    });
    return result ? true : false;
  }

  async getSavedJobIds(talentUserId: string): Promise<string[]> {
    const savedJobs = await SavedJobModel.find({ talentUserId }).select(
      "jobId"
    );
    return savedJobs.map((job) => job.jobId.toString());
  }

  async getSavedJobs(
    talentUserId: string,
    page: number = 1,
    size: number = 10
  ): Promise<{
    data: SavedJobDocument[];
    total: number;
    page: number;
    size: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * size;
    const total = await SavedJobModel.countDocuments({ talentUserId });
    const data = await SavedJobModel.find({ talentUserId })
      .sort({ savedAt: -1 })
      .skip(skip)
      .limit(size);

    return {
      data,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  async isSaved(talentUserId: string, jobId: string): Promise<boolean> {
    const saved = await SavedJobModel.findOne({
      talentUserId,
      jobId,
    });
    return !!saved;
  }
}
