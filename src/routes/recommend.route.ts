import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import { recommendJobsForCandidate } from "../controllers/recommend.controller";

const router = Router();

// Route for candidate-specific recommendations
router.get("/:candidateId", protect, recommendJobsForCandidate);

export default router;
