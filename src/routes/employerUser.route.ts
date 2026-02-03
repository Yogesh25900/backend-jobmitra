import { Router } from "express";
import { EmployerUserController } from "../controllers/employerUser.controller";
import { parseFormData } from "../middlewares/uploads";
import { protect } from "../middlewares/auth.middleware";

const router = Router();
const employerController = new EmployerUserController();


router.post("/register", parseFormData, (req, res) => employerController.registerEmployer(req, res));
router.post("/login", parseFormData, (req, res) => employerController.loginEmployer(req, res));

router.get("/", (req, res) => employerController.getAllEmployers(req, res));
router.get("/:id", (req, res) => employerController.getEmployerById(req, res));
router.put("/:id", protect, parseFormData, (req, res) => employerController.updateEmployer(req, res));

export default router;
