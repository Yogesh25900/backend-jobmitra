import { Router } from "express";
import {
  createJobApplication,
  getApplicationById,
  getAllApplications,
  getApplicationsByJobId,
  getApplicationsByJobIdWithScore,
  getMyApplications,
  getMyApplicationStats,
  getEmployerApplications,
  getEmployerApplicationStats,
  updateApplicationStatus,
  deleteApplication,
} from "../controllers/jobApplication.controller";
import { protect } from "../middlewares/auth.middleware";
import { uploadResume } from "../middlewares/uploads";
import asyncHandler from "../middlewares/async";

const router = Router();

router.get("/", asyncHandler(getAllApplications));
router.get("/:id", asyncHandler(getApplicationById));
router.get("/job/:jobId/with-score", asyncHandler(getApplicationsByJobIdWithScore));
router.get("/job/:jobId", asyncHandler(getApplicationsByJobId));

router.post(
  "/",
  protect,
  uploadResume.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'coverLetterDocument', maxCount: 1 }
  ]),
  asyncHandler(createJobApplication)
);
router.get("/talent/my-applications", protect, asyncHandler(getMyApplications));
router.get("/talent/my-stats", protect, asyncHandler(getMyApplicationStats));

router.get("/employer/applications", protect, asyncHandler(getEmployerApplications));
router.get("/employer/stats", protect, asyncHandler(getEmployerApplicationStats));
router.patch("/:id/status", protect, asyncHandler(updateApplicationStatus));

router.delete("/:id", protect, asyncHandler(deleteApplication));

export default router;
