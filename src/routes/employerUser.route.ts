import { Router } from "express";
import { EmployerUserController } from "../controllers/employerUser.controller";
import { parseFormData, uploadImage } from "../middlewares/uploads";
import { protect } from "../middlewares/auth.middleware";

const router = Router();
const employerController = new EmployerUserController();


router.post("/register", parseFormData, (req, res) => employerController.registerEmployer(req, res));
router.post("/login", parseFormData, (req, res) => employerController.loginEmployer(req, res));
router.post("/google-login", parseFormData, (req, res) => employerController.googleLoginEmployer(req, res));

router.get("/", (req, res) => employerController.getAllEmployers(req, res));
router.get("/:id", (req, res) => employerController.getEmployerById(req, res));
router.put(
	"/:id",
	protect,
	uploadImage.single("logoPath"),
	(req, res) => employerController.updateEmployer(req, res)
);


router.post('/forgot-password', parseFormData, (req, res) => employerController.sendPasswordResetOtp(req, res));
router.post('/verify-otp', parseFormData, (req, res) => employerController.verifyOTP(req, res));
router.post('/reset-password', parseFormData, (req, res) => employerController.resetPassword(req, res));

export default router;
