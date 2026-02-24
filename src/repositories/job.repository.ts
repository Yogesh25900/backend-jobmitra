import { JobDocument, JobModel } from "../models/job.model";

export interface IJobRepository {
  createJob(jobData: Partial<JobDocument>): Promise<JobDocument>;
  getJobById(id: string): Promise<JobDocument | null>;
  getJobsByEmployerId(
    employerId: string,
    skip?: number,
    limit?: number,
    status?: "Active" | "Inactive",
    searchQuery?: string,
  ): Promise<{ data: JobDocument[]; total: number }>;
  getJobsByIds(ids: string[]): Promise<JobDocument[]>;
  getAllJobs(status?: string | null): Promise<JobDocument[]>;
  getJobStats(): Promise<{ totalJobs: number; activeJobs: number; inactiveJobs: number }>;
  countJobsByEmployerId(employerId: string): Promise<number>;
  updateJob(id: string, updateData: Partial<JobDocument>): Promise<JobDocument | null>;
  deleteJob(id: string): Promise<boolean>;
  searchJobs(filters: any, page?: number, size?: number): Promise<{ data: JobDocument[]; total: number; page: number; size: number; totalPages: number; }>;
}

export class JobRepository implements IJobRepository {
  async createJob(jobData: Partial<JobDocument>): Promise<JobDocument> {
    const job = new JobModel(jobData);
    await job.save();
    return job;
  }

  async getJobById(id: string): Promise<JobDocument | null> {
    return await JobModel.findById(id).populate('jobCategory').populate('employerId');
  }

  async getJobsByEmployerId(
    employerId: string,
    skip: number = 0,
    limit: number = 5,
    status?: "Active" | "Inactive",
    searchQuery?: string,
  ): Promise<{ data: JobDocument[]; total: number }> {
    const query: any = { employerId };

    if (status) {
      query.status = status;
    }

    if (searchQuery && searchQuery.trim()) {
      const searchValue = searchQuery.trim();
      query.$or = [
        { jobTitle: { $regex: searchValue, $options: 'i' } },
        { companyName: { $regex: searchValue, $options: 'i' } },
        { jobDescription: { $regex: searchValue, $options: 'i' } },
      ];
    }

    const data = await JobModel.find(query)
      .populate('jobCategory')
      .populate('employerId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const total = await JobModel.countDocuments(query);
    return { data, total };
  }

  async getJobsByIds(ids: string[]): Promise<JobDocument[]> {
    return await JobModel.find({ _id: { $in: ids } }).populate('jobCategory').populate('employerId');
  }

  async countJobsByEmployerId(employerId: string): Promise<number> {
    return await JobModel.countDocuments({ employerId });
  }

  async getAllJobs(status?: string | null, search?: string | null): Promise<JobDocument[]> {
    const query: any = {};
    
    if (status && status !== 'All') {
      query.status = status;
    }
    
    if (search && search.trim() !== '') {

      const searchTerm = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special regex characters
      const searchRegex = `\\b${searchTerm}`;
      
      query.$or = [
        { jobTitle: { $regex: searchRegex, $options: 'i' } },
        { companyName: { $regex: searchRegex, $options: 'i' } },
        { jobDescription: { $regex: searchRegex, $options: 'i' } }
      ];
    }
    
    return await JobModel.find(query).populate('jobCategory').populate('employerId');
  }

  async updateJob(id: string, updateData: Partial<JobDocument>): Promise<JobDocument | null> {
    return await JobModel.findByIdAndUpdate(id, updateData, { new: true }).populate('jobCategory').populate('employerId');
  }

  async deleteJob(id: string): Promise<boolean> {
    const result = await JobModel.findByIdAndDelete(id);
    return result ? true : false;
  }

  async getJobStats(): Promise<{ totalJobs: number; activeJobs: number; inactiveJobs: number }> {
    const totalJobs = await JobModel.countDocuments();
    const activeJobs = await JobModel.countDocuments({ status: 'Active' });
    const inactiveJobs = await JobModel.countDocuments({ status: 'Inactive' });
    
    return {
      totalJobs,
      activeJobs,
      inactiveJobs,
    };
  }

  async searchJobs(filters: any, page: number = 1, size: number = 10): Promise<{ data: JobDocument[]; total: number; page: number; size: number; totalPages: number; }> {
    const query: any = {};
    const sortBy = filters?.sortBy as string | undefined;
    
    if (filters.jobTitle) {
      query.jobTitle = { $regex: filters.jobTitle, $options: "i" };
    }
    if (filters.jobLocation) {
      query.jobLocation = { $regex: `^${filters.jobLocation}$`, $options: "i" };
    }
    if (filters.jobType) {
      query.jobType = filters.jobType;
    }
    if (filters.experienceLevel) {
      query.experienceLevel = filters.experienceLevel;
    }
    if (filters.jobCategory) {
      query.jobCategory = filters.jobCategory;
    }
    if (filters.status) {
      query.status = filters.status;
    }

    const total = await JobModel.countDocuments(query);
    const totalPages = Math.ceil(total / size);
    const skip = (page - 1) * size;

    const sort: Record<string, 1 | -1> =
      sortBy === "Oldest" ? { createdAt: 1 } : { createdAt: -1 };

    const data = await JobModel.find(query)
      .populate('jobCategory')
      .populate('employerId')
      .sort(sort)
      .skip(skip)
      .limit(size);

    return {
      data,
      total,
      page,
      size,
      totalPages,
    };
  }
}
