import { Router } from "express";
import { protect } from "../middlewares/auth.middleware";
import { getExtractedCandidateById } from "../controllers/extractedCandidate.controller";

const router = Router();

router.get("/:candidateId", protect, getExtractedCandidateById);

export default router;
