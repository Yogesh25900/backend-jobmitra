import { Router } from "express";
import { AdminController } from "../controllers/admin/admin.controller";
import { protect, authorize } from "../middlewares/auth.middleware";
import { parseFormData, uploadImage } from "../middlewares/uploads";

const router = Router();
const adminController = new AdminController();

// Health check - public route
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Admin API is working",
    timestamp: new Date().toISOString(),
  });
});

// Public routes
router.post("/register", parseFormData, (req, res) => adminController.createAdmin(req, res));
router.post("/login", parseFormData, (req, res) => adminController.loginAdmin(req, res));

// Protected routes - only accessible by admin
router.use(protect);
router.use(authorize("admin"));

// Dashboard statistics routes
router.get("/dashboard/stats", (req, res) => adminController.getDashboardStats(req, res));
router.get("/dashboard/job-trends", (req, res) => adminController.getJobPostingTrends(req, res));
router.get("/dashboard/activities", (req, res) => adminController.getRecentActivities(req, res));

// Admin profile and security routes
router.get("/profile/me", (req, res) => adminController.getMyProfile(req, res));
router.put("/profile/me", (req, res) => adminController.updateMyProfile(req, res));
router.put("/change-password", (req, res) => adminController.changeMyPassword(req, res));

// User management routes
router.post("/users", uploadImage.single('profilePicture'), (req, res) => adminController.createUserAsAdmin(req, res));
router.get("/users", (req, res) => adminController.getAllUsers(req, res));
router.get("/users/:id", (req, res) => adminController.getUserById(req, res));
router.put("/users/:id", uploadImage.single('profilePicture'), (req, res) => adminController.updateUserById(req, res));
router.delete("/users/:id", (req, res) => adminController.deleteUserById(req, res));

// Feedback management routes
router.get("/feedback", (req, res) => adminController.getAllFeedback(req, res));
router.get("/feedback/stats", (req, res) => adminController.getFeedbackStats(req, res));
router.patch("/feedback/:id", (req, res) => adminController.updateFeedbackStatus(req, res));
router.delete("/feedback/:id", (req, res) => adminController.deleteFeedback(req, res));

export default router;
