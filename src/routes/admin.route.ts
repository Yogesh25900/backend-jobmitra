import { Router } from "express";
import { AdminController } from "../controllers/admin/admin.controller";
import { protect, authorize } from "../middlewares/auth.middleware";
import { parseFormData, uploadImage } from "../middlewares/uploads";

const router = Router();
const adminController = new AdminController();

// Public routes
router.post("/register", parseFormData, (req, res) => adminController.createAdmin(req, res));
router.post("/login", parseFormData, (req, res) => adminController.loginAdmin(req, res));

// Protected routes - only accessible by admin
router.use(protect);
router.use(authorize("admin"));

// User management routes
router.post("/users", uploadImage.single('profilePicture'), (req, res) => adminController.createUserAsAdmin(req, res));
router.get("/users", (req, res) => adminController.getAllUsers(req, res));
router.get("/users/:id", (req, res) => adminController.getUserById(req, res));
router.put("/users/:id", uploadImage.single('profilePicture'), (req, res) => adminController.updateUserById(req, res));
router.delete("/users/:id", (req, res) => adminController.deleteUserById(req, res));

export default router;
