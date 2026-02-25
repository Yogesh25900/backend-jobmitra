import { JobApplicationModel, JobApplicationDocument } from "../models/jobApplication.model";
import { JobApplicationType } from "../types/jobApplication.type";
import mongoose from "mongoose";

export class JobApplicationRepository {
  async create(applicationData: Partial<JobApplicationType>): Promise<JobApplicationDocument> {
    const application = new JobApplicationModel(applicationData);
    return await application.save();
  }

  async findById(id: string): Promise<JobApplicationDocument | null> {
    return await JobApplicationModel.findById(id)
      .populate("jobId")
      .populate("talentId")
      .populate("employerId");
  }

  async findAll(): Promise<JobApplicationDocument[]> {
    return await JobApplicationModel.find()
      .populate("jobId")
      .populate("talentId")
      .populate("employerId")
      .sort({ appliedAt: -1 });
  }

  async findByJobId(jobId: string, skip: number = 0, limit: number = 10, filters?: any): Promise<{ data: JobApplicationDocument[], total: number }> {
    const query: any = { jobId };

    if (filters?.status) {
      query.status = filters.status;
    }
    if (filters?.searchQuery) {
      query.$or = [
        { fullName: { $regex: filters.searchQuery, $options: "i" } },
        { email: { $regex: filters.searchQuery, $options: "i" } },
        { currentCompany: { $regex: filters.searchQuery, $options: "i" } },
      ];
    }

    const sortBy = filters?.sortBy || "appliedAt";
    const sortOrder = filters?.sortOrder === "asc" ? 1 : -1;

    const applications = await JobApplicationModel.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder });

    const total = await JobApplicationModel.countDocuments(query);

    return { data: applications, total };
  }

  async findByTalentId(talentId: string, skip: number = 0, limit: number = 10, filters?: any): Promise<{ data: JobApplicationDocument[], total: number }> {
    console.log('[Repository] findByTalentId called with:', talentId);
    console.log('[Repository] talentId type:', typeof talentId);
    
    const query: any = { talentId };

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.searchQuery) {
      
      query.$or = [
        { status: { $regex: filters.searchQuery, $options: "i" } },
      ];
    }

    const sortBy = filters?.sortBy || "appliedAt";
    const sortOrder = filters?.sortOrder === "asc" ? 1 : -1;

    const applications = await JobApplicationModel.find(query)
      .populate("jobId")
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder });
    
    console.log(' [Repository] Query result:', applications.length, 'applications');
    
    if (applications.length === 0) {
      const allApps = await JobApplicationModel.find({}).limit(5);
      console.log(' [Repository] Sample applications in DB:', allApps.length);
      if (allApps.length > 0) {
        console.log(' [Repository] Sample talentId from DB:', allApps[0].talentId);
        console.log('[Repository] Sample talentId type:', typeof allApps[0].talentId);
        console.log(' [Repository] Comparison:', {
          queryTalentId: talentId,
          dbTalentId: allApps[0].talentId?.toString(),
          match: allApps[0].talentId?.toString() === talentId
        });
      }
    }

    const total = await JobApplicationModel.countDocuments(query);
    return { data: applications, total };
  }

  async findByEmployerId(employerId: string, skip: number = 0, limit: number = 10, filters?: any): Promise<{ data: JobApplicationDocument[], total: number }> {
    let employerIdFilter: any = employerId;
    if (employerId.match(/^[0-9a-fA-F]{24}$/)) {
      employerIdFilter = {
        $or: [
          employerId,  
          new mongoose.Types.ObjectId(employerId)  
        ]
      };
    }
    
    const query: any = { employerId: employerIdFilter };

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.searchQuery) {
      query.$or = [
        { fullName: { $regex: filters.searchQuery, $options: "i" } },
        { email: { $regex: filters.searchQuery, $options: "i" } },
        { currentCompany: { $regex: filters.searchQuery, $options: "i" } },
      ];
    }

    const sortBy = filters?.sortBy || "appliedAt";
    const sortOrder = filters?.sortOrder === "asc" ? 1 : -1;

    const applications = await JobApplicationModel.find(query)
      .populate("jobId")
      .populate("talentId")
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder });

    const total = await JobApplicationModel.countDocuments(query);
    return { data: applications, total };
  }

  async getStatsByTalentId(talentId: string): Promise<{ totalApplications: number; shortlisted: number; rejected: number }> {
    const [totalApplications, statusCounts] = await Promise.all([
      JobApplicationModel.countDocuments({ talentId }),
      JobApplicationModel.aggregate([
        { $match: { talentId } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const shortlisted = statusCounts.find((item: any) => item._id === "Shortlisted")?.count || 0;
    const rejected = statusCounts.find((item: any) => item._id === "Rejected")?.count || 0;

    return {
      totalApplications,
      shortlisted,
      rejected,
    };
  }

  async getStatsByEmployerId(employerId: string): Promise<{ totalApplicants: number; shortlisted: number }> {
    // Query applications where the job belongs to this employer
    console.log(' [Repository] getStatsByEmployerId called with:', employerId, 'type:', typeof employerId);
    
    let matchFilter: any = { employerId };
    
    try {
      if (employerId.match(/^[0-9a-fA-F]{24}$/)) {
        matchFilter = {
          $or: [
            { employerId: employerId },  // String match
            { employerId: new mongoose.Types.ObjectId(employerId) }  // ObjectId match
          ]
        };
      }
    } catch (err) {
      console.log(' [Repository] Could not convert to ObjectId, using string match only');
    }
    
    const [totalApplicants, statusCounts] = await Promise.all([
      JobApplicationModel.countDocuments(matchFilter),
      JobApplicationModel.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    console.log(' [Repository] Query result - totalApplicants:', totalApplicants, 'statusCounts:', statusCounts);
    
    const allApps = await JobApplicationModel.find({}).select('employerId jobId talentId').limit(5);
    console.log(' [Repository] Sample applications in DB:');
    allApps.forEach((app: any) => {
      console.log(`  - jobId: ${app.jobId}, talentId: ${app.talentId}, employerId: ${app.employerId} (type: ${typeof app.employerId})`);
    });

    const shortlisted = statusCounts.find((item: any) => item._id === "Shortlisted")?.count || 0;

    return {
      totalApplicants,
      shortlisted,
    };
  }

  async checkIfAlreadyApplied(jobId: string, talentId: string): Promise<boolean> {
    const existing = await JobApplicationModel.findOne({ jobId, talentId });
    return !!existing;
  }

  async countApplicationsByJobId(jobId: string): Promise<number> {
    return await JobApplicationModel.countDocuments({ jobId });
  }

  async updateStatus(id: string, status: string): Promise<JobApplicationDocument | null> {
    return await JobApplicationModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
  }

  async delete(id: string): Promise<JobApplicationDocument | null> {
    return await JobApplicationModel.findByIdAndDelete(id);
  }
}
