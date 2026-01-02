import { Router } from "express";
import { EmployerUserController } from "../controllers/employerUser.controller";

const router = Router();
const employerController = new EmployerUserController();


router.post("/register", (req, res) => employerController.registerEmployer(req, res));
router.post("/login", (req, res) => employerController.loginEmployer(req, res));


router.get("/", (req, res) => employerController.getAllEmployers(req, res));
router.get("/:id", (req, res) => employerController.getEmployerById(req, res));
router.put("/:id", (req, res) => employerController.updateEmployer(req, res));

export default router;
