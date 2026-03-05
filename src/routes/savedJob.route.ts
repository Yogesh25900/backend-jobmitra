import { Router } from "express";
import { SavedJobController } from "../controllers/savedJob.controller";
import { protect } from "../middlewares/auth.middleware";

const router = Router();
const savedJobController = new SavedJobController();

// Add job to saved list (protected)
router.post("/add", protect, (req, res) =>
  savedJobController.addSavedJob(req, res)
);

// Remove job from saved list (protected)
router.delete("/:jobId", protect, (req, res) =>
  savedJobController.removeSavedJob(req, res)
);

// Get all saved jobs with pagination (protected)
router.get("/list", protect, (req, res) =>
  savedJobController.getSavedJobs(req, res)
);

// Get saved job IDs only (protected)
router.get("/ids/list", protect, (req, res) =>
  savedJobController.getSavedJobIds(req, res)
);

export default router;
