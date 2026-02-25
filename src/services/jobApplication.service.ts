import { JobApplicationRepository } from "../repositories/jobApplication.repository";
import { JobApplicationType } from "../types/jobApplication.type";
import { HttpError } from "../errors/http-error";
import { notifyEmployerOnApplication, notifyApplicantStatusChange, notifyAdminOnNewApplication } from "./notification.service";

export class JobApplicationService {
  private jobApplicationRepository: JobApplicationRepository;

  constructor() {
    this.jobApplicationRepository = new JobApplicationRepository();
  }

  async createApplication(applicationData: Partial<JobApplicationType>) {
    // Check if already applied
    const alreadyApplied = await this.jobApplicationRepository.checkIfAlreadyApplied(
      applicationData.jobId!,
      applicationData.talentId!
    );

    if (alreadyApplied) {
      throw new HttpError( 409,"Already applied for this job");
    }

    const created = await this.jobApplicationRepository.create(applicationData);
    if (created?.jobId) {
      await notifyEmployerOnApplication(created.jobId.toString());
      // Also notify admin about new application
      await notifyAdminOnNewApplication(created.jobId.toString(), created.talentId!.toString());
    }
    return created;
  }

  async getApplicationById(id: string) {
    const application = await this.jobApplicationRepository.findById(id);
    if (!application) {
      throw new HttpError(404, "Application not found");
    }
    return application;
  }

  async getAllApplications() {
    return await this.jobApplicationRepository.findAll();
  }

  async getApplicationsByJobId(jobId: string, page: number = 1, size: number = 10, filters?: any) {
    const skip = (page - 1) * size;
    const { data, total } = await this.jobApplicationRepository.findByJobId(jobId, skip, size, filters);
    return {
      data,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  async getApplicationsByTalentId(talentId: string, page: number = 1, size: number = 10, filters?: any) {
    console.log('[Service] getApplicationsByTalentId called with:', talentId);
    console.log(' [Service] talentId type:', typeof talentId);
    const skip = (page - 1) * size;
    const { data, total } = await this.jobApplicationRepository.findByTalentId(talentId, skip, size, filters);
    console.log('[Service] Found applications:', data.length);
    return {
      data,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  async getApplicationStatsByTalentId(talentId: string) {
    return await this.jobApplicationRepository.getStatsByTalentId(talentId);
  }

  async getApplicationStatsByEmployerId(employerId: string) {
    return await this.jobApplicationRepository.getStatsByEmployerId(employerId);
  }

  async getApplicationsByEmployerId(employerId: string, page: number = 1, size: number = 10, filters?: any) {
    const skip = (page - 1) * size;
    const { data, total } = await this.jobApplicationRepository.findByEmployerId(employerId, skip, size, filters);
    return {
      data,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  async updateApplicationStatus(id: string, status: string) {
    console.log('[Service] updateApplicationStatus called');
    console.log('[Service] applicationId:', id, 'newStatus:', status);
    
    const application = await this.jobApplicationRepository.updateStatus(id, status);
    if (!application) {
      console.log('[Service] Application not found');
      throw new HttpError(404, "Application not found");
    }
    
    console.log('[Service] Application updated in DB, notifying applicant...');
    console.log('[Service] Application talentId:', application.talentId);
    
    // Notify applicant about status change
    await notifyApplicantStatusChange(application._id.toString(), status);
    
    console.log('[Service] Notification sent, returning application');
    return application;
  }

  async deleteApplication(id: string) {
    const application = await this.jobApplicationRepository.delete(id);
    if (!application) {
      throw new HttpError(404, "Application not found");
    }
    return application;
  }
}
