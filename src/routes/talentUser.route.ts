import { Router } from "express";
import { TalentUserController } from "../controllers/talentUser.controller";

const router = Router();
const talentController = new TalentUserController();


router.post("/register", (req, res) => talentController.registerTalent(req, res));
router.post("/login", (req, res) => talentController.loginTalent(req, res));


router.get("/", (req, res) => talentController.getAllTalents(req, res));
router.get("/:id", (req, res) => talentController.getTalentById(req, res));
router.put("/:id", (req, res) => talentController.updateTalent(req, res));

export default router;
