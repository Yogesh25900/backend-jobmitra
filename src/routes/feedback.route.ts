import { Router } from "express";
import { FeedbackController } from "../controllers/feedback.controller";
import { protect } from "../middlewares/auth.middleware";
import { uploadFeedback } from "../middlewares/uploads";
import asyncHandler from "../middlewares/async";

const router = Router();
const feedbackController = new FeedbackController();

router.post(
  "/",
  protect,
  uploadFeedback.fields([
    { name: "screenshot", maxCount: 1 },
    { name: "attachment", maxCount: 1 },
  ]),
  asyncHandler((req, res) => feedbackController.createFeedback(req, res))
);

router.get(
  "/my-feedback",
  protect,
  asyncHandler((req, res) => feedbackController.getUserFeedback(req, res))
);

router.get(
  "/:id",
  protect,
  asyncHandler((req, res) => feedbackController.getFeedbackById(req, res))
);

router.get(
  "/",
  protect,
  asyncHandler((req, res) => feedbackController.getAllFeedback(req, res))
);

router.patch(
  "/:id",
  protect,
  asyncHandler((req, res) => feedbackController.updateFeedback(req, res))
);

router.delete(
  "/:id",
  protect,
  asyncHandler((req, res) => feedbackController.deleteFeedback(req, res))
);

router.get(
  "/stats/all",
  protect,
  asyncHandler((req, res) => feedbackController.getFeedbackStats(req, res))
);

export default router;
