import { NotificationModel } from "../models/notification.model";
import { NotificationRepository } from "../repositories/notification.repository";
import { JobModel } from "../models/job.model";
import { TalentUserModel } from "../models/talentUser_model";
import { JobApplicationModel } from "../models/jobApplication.model";
import { getIo } from "../socket";

const notificationRepository = new NotificationRepository();

const emitToUser = (userId: string, notification: any) => {
  try {
    const io = getIo();
    
    // Skip Socket.io emission in test environment
    if (!io) {
      console.log('[NotificationService] Socket.io not available, skipping real-time notification (test mode)');
      return;
    }
    
    console.log('[NotificationService] About to emit notification');
    console.log('[NotificationService] Target userId type:', typeof userId);
    console.log('[NotificationService] Target userId value:', userId);
    console.log('[NotificationService] Target userId.toString():', userId.toString());
    console.log('[NotificationService] Emitting notification to room:', userId.toString());
    console.log('[NotificationService] Notification:', {
      title: notification.title,
      message: notification.message,
      type: notification.type,
    });
    
    const roomName = userId.toString();
    
    // Check if adapter exists and get room info
    try {
      const socketsInRoom = io.sockets.adapter.rooms.get(roomName);
      console.log('[NotificationService] Sockets in room "' + roomName + '":', socketsInRoom?.size ?? 0);
      
      if (!socketsInRoom || socketsInRoom.size === 0) {
        console.log('[NotificationService] WARNING: No sockets found in room "' + roomName + '". User might not be connected.');
        
        // List all available rooms
        const allRooms = Array.from(io.sockets.adapter.rooms.keys());
        console.log('[NotificationService] Available rooms:', allRooms);
        console.log('[NotificationService] Looking for room starting with userId:', roomName);
        
        // Check if there's a similar room
        const similarRooms = allRooms.filter(r => r.includes(userId) || userId.includes(r));
        if (similarRooms.length > 0) {
          console.log('[NotificationService] Found similar rooms:', similarRooms);
        }
      }
    } catch (adapterError) {
      console.log('[NotificationService] Could not check adapter, proceeding with emit:', adapterError);
    }
    
    // Emit the notification regardless
    io.to(roomName).emit("notification", notification);
    console.log('[NotificationService] Notification emitted successfully to room: ' + roomName);
  } catch (error) {
    console.error('[NotificationService] Socket emit error:', error);
  }
};

export const createNotification = async (data: {
  userId: string;
  title: string;
  message: string;
  type: string;
}) => {
  console.log('[NotificationService] createNotification called');
  console.log('[NotificationService] Data:', {
    userId: data.userId,
    title: data.title,
    type: data.type,
  });
  
  const notification = await NotificationModel.create({
    userId: data.userId,
    title: data.title,
    message: data.message,
    type: data.type,
  });

  console.log('[NotificationService] Notification created in DB');
  console.log('[NotificationService] Notification ID:', notification._id);
  console.log('[NotificationService] Now emitting to user...');
  
  emitToUser(data.userId, notification);
  return notification;
};

export const getUserNotificationsWithPagination = async (
  userId: string,
  page: number = 1,
  size: number = 10,
  filters?: any
) => {
  console.log('[NotificationService] getUserNotificationsWithPagination called');
  console.log('[NotificationService] userId:', userId);
  console.log('[NotificationService] page:', page, 'size:', size);

  const skip = (page - 1) * size;
  const { data, total } = await notificationRepository.findByUserIdPaginated(userId, skip, size, filters);

  console.log('[NotificationService] Found notifications:', data.length);

  return {
    data,
    total,
    page,
    size,
    totalPages: Math.ceil(total / size),
  };
};

export const notifyEmployerOnApplication = async (jobId: string) => {
  console.log('[NotificationService] notifyEmployerOnApplication called');
  console.log('[NotificationService] jobId:', jobId);
  
  const job = await JobModel.findById(jobId);
  if (!job) {
    console.log('[NotificationService] Job not found');
    return null;
  }

  console.log('[NotificationService] Job found:', job.jobTitle);
  console.log('[NotificationService] Employer ID:', job.employerId);
  console.log('[NotificationService] Employer ID type:', typeof job.employerId);

  return createNotification({
    userId: job.employerId,
    title: "New Application Received",
    message: `Someone applied for ${job.jobTitle}. Check your applicants!`,
    type: "application",
  });
};

export const notifyCandidatesOnNewJob = async (jobId: string) => {
  const job = await JobModel.findById(jobId);
  if (!job) return 0;

  // Also notify admin about the new job posting
  await notifyAdminOnNewJob(jobId);

  const candidates = await TalentUserModel.find({ role: "candidate" }).select("_id");
  if (!candidates.length) return 0;

  const notifications = candidates.map((candidate) => ({
    userId: candidate._id.toString(),
    title: "New job posted",
    message: `${job.jobTitle} at ${job.companyName}`,
    type: "job",
  }));

  const created = await NotificationModel.insertMany(notifications);
  created.forEach((notification) => emitToUser(notification.userId, notification));

  return created.length;
};

export const notifyAdminOnNewJob = async (jobId: string) => {
  console.log('[NotificationService] notifyAdminOnNewJob called');
  console.log('[NotificationService] jobId:', jobId);
  
  try {
    const job = await JobModel.findById(jobId).populate('employerId', 'companyName contactName');
    if (!job) {
      console.log('[NotificationService] Job not found');
      return null;
    }

    const companyName = job.companyName || (job.employerId && typeof job.employerId === 'object' ? job.employerId.companyName : 'Unknown Company');
    
    // Create a special notification for admin dashboard activity feed
    // Using a special admin userId or storing it with type "job_posted" for dashboard visibility
    const adminNotification = await createNotification({
      userId: "admin", // Special identifier for admin dashboard
      title: "New Job Posted",
      message: `${job.jobTitle} posted by ${companyName}`,
      type: "job_posted",
    });

    console.log('[NotificationService] Admin notification created for new job:', adminNotification._id);
    return adminNotification;
  } catch (error: any) {
    console.error('[NotificationService] Error creating admin notification:', error.message);
    return null;
  }
};

export const notifyAdminOnNewTalent = async (talentUserId: string) => {
  console.log('[NotificationService] notifyAdminOnNewTalent called');
  
  try {
    const talent = await TalentUserModel.findById(talentUserId);
    if (!talent) {
      console.log('[NotificationService] Talent user not found');
      return null;
    }

    const talentName = `${talent.fname || ''} ${talent.lname || ''}`.trim() || 'New Talent';
    const title = talent.title || 'Job Seeker';
    
    const adminNotification = await createNotification({
      userId: "admin",
      title: "New Talent Joined",
      message: `${talentName} registered as ${title}`,
      type: "talent_joined",
    });

    console.log('[NotificationService] Admin notification created for new talent:', adminNotification._id);
    return adminNotification;
  } catch (error: any) {
    console.error('[NotificationService] Error creating admin notification for new talent:', error.message);
    return null;
  }
};

export const notifyAdminOnNewApplication = async (jobId: string, talentId: string) => {
  console.log('[NotificationService] notifyAdminOnNewApplication called');
  
  try {
    const job = await JobModel.findById(jobId);
    const talent = await TalentUserModel.findById(talentId);
    
    if (!job || !talent) {
      console.log('[NotificationService] Job or Talent not found');
      return null;
    }

    const talentName = `${talent.fname || ''} ${talent.lname || ''}`.trim() || 'Applicant';
    
    const adminNotification = await createNotification({
      userId: "admin",
      title: "New Application Submitted",
      message: `${talentName} applied for ${job.jobTitle}`,
      type: "application_submitted",
    });

    console.log('[NotificationService] Admin notification created for new application:', adminNotification._id);
    return adminNotification;
  } catch (error: any) {
    console.error('[NotificationService] Error creating admin notification for new application:', error.message);
    return null;
  }
};

export const notifyApplicantShortlisted = async (applicationId: string) => {
  const application = await JobApplicationModel.findById(applicationId);
  if (!application) return null;

  const job = await JobModel.findById(application.jobId);
  const jobTitle = job?.jobTitle ?? "the role";

  return createNotification({
    userId: application.talentId,
    title: "Application Shortlisted!",
    message: `Congratulations! Your application for ${jobTitle} has been shortlisted.`,
    type: "shortlisted",
  });
};

export const notifyApplicantStatusChange = async (applicationId: string, status: string) => {
  console.log('[NotificationService] notifyApplicantStatusChange called');
  console.log('[NotificationService] applicationId:', applicationId);
  console.log('[NotificationService] newStatus:', status);
  
  const application = await JobApplicationModel.findById(applicationId);
  if (!application) {
    console.log('[NotificationService] Application not found');
    return null;
  }

  console.log('[NotificationService] Application found, talentId:', application.talentId);

  const job = await JobModel.findById(application.jobId);
  const jobTitle = job?.jobTitle ?? "the role";

  let title = "Application Status Updated";
  let message = `Your application for ${jobTitle} status has been updated to: ${status}`;
  let type = "application";

  switch (status.toLowerCase()) {
    case "shortlisted":
      title = "Application Shortlisted!";
      message = `Congratulations! Your application for ${jobTitle} has been shortlisted.`;
      type = "shortlisted";
      break;
    case "interview scheduled":
      title = "Interview Scheduled";
      message = `Interview scheduled for your application to ${jobTitle}.`;
      type = "interview";
      break;
    case "hired":
      title = "Congratulations! You're Hired!";
      message = `You have been hired for the position of ${jobTitle}!`;
      type = "hired";
      break;
    case "rejected":
      title = "Application Status Update";
      message = `Your application for ${jobTitle} was not selected this time.`;
      type = "rejected";
      break;
  }

  console.log('[NotificationService] Creating notification with:', {
    userId: application.talentId,
    title,
    message,
    type,
  });

  return createNotification({
    userId: application.talentId,
    title,
    message,
    type,
  });
};
