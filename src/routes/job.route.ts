import { Router } from "express";
import { JobController } from "../controllers/job.controller";
import { protect } from "../middlewares/auth.middleware";
import { parseFormData } from "../middlewares/uploads";
import { checkMeilisearchHealth } from "../config/meilisearch.client";

const router = Router();
const jobController = new JobController();

router.get("/health/search", async (req, res) => {
  try {
    const isHealthy = await checkMeilisearchHealth();
    return res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      message: isHealthy ? "Meilisearch is running" : "Meilisearch is not responding",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return res.status(503).json({
      success: false,
      message: "Meilisearch health check failed",
      error: error.message,
    });
  }
});

router.post("/", protect, parseFormData, (req, res) => jobController.createJob(req, res));
router.get("/", (req, res) => jobController.getAllJobs(req, res));
router.get("/stats/overview", (req, res) => jobController.getJobStats(req, res));
router.get("/search", (req, res) => jobController.searchJobs(req, res));
router.get("/employer/my-jobs", protect, (req, res) => jobController.getMyJobs(req, res));
router.get("/employer/stats", protect, (req, res) => jobController.getMyJobStats(req, res));
router.get("/:id", (req, res) => jobController.getJobById(req, res));
router.put("/:id", protect, parseFormData, (req, res) => jobController.updateJob(req, res));
router.delete("/:id", protect, (req, res) => jobController.deleteJob(req, res));

export default router;
