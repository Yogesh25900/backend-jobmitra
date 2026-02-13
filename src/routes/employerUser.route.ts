import { Router } from "express";
import { EmployerUserController } from "../controllers/employerUser.controller";
import { parseFormData, uploadImage } from "../middlewares/uploads";
import { protect } from "../middlewares/auth.middleware";

const router = Router();
const employerController = new EmployerUserController();


router.post("/register", parseFormData, (req, res) => employerController.registerEmployer(req, res));
router.post("/login", parseFormData, (req, res) => employerController.loginEmployer(req, res));

router.get("/", (req, res) => employerController.getAllEmployers(req, res));
router.get("/:id", (req, res) => employerController.getEmployerById(req, res));
router.put(
	"/:id",
	protect,
	uploadImage.single("logoPath"),
	(req, res) => employerController.updateEmployer(req, res)
);

// Password reset routes
// Step 1: Request OTP via email
router.post('/forgot-password', parseFormData, (req, res) => employerController.sendPasswordResetOtp(req, res));

// Step 2: Verify OTP (NEW ENDPOINT)
router.post('/verify-otp', parseFormData, (req, res) => employerController.verifyOTP(req, res));

// Step 3: Reset password with new password (NEW ENDPOINT)
router.post('/reset-password', parseFormData, (req, res) => employerController.resetPassword(req, res));

export default router;
