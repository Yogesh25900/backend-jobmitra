import { Router, Request, Response, NextFunction } from "express";
import { TalentUserController } from "../controllers/talentUser.controller";
import { protect } from "../middlewares/auth.middleware";
import { uploadImage, parseFormData, uploadFiles } from "../middlewares/uploads";

const router = Router();
const talentController = new TalentUserController();

router.use((req, res, next) => {
  console.log(' [TALENT ROUTER] Incoming request:', req.method, req.path);
  next();
});

const parseJsonFields = (req: Request, res: Response, next: NextFunction) => {
  console.log('\n [MIDDLEWARE] parseJsonFields - Processing request body');
  
  const fieldsToParse = ["skills", "experiences", "education", "certifications", "portfolio", "links"];
  
  for (const field of fieldsToParse) {
    if (req.body[field] && typeof req.body[field] === "string") {
      console.log(` [MIDDLEWARE] Parsing ${field}:`, req.body[field].substring(0, 50));
      
      try {
        req.body[field] = JSON.parse(req.body[field]);
        console.log(` [MIDDLEWARE] ✓ ${field} parsed successfully`);
      } catch (e) {
        console.log(` [MIDDLEWARE] Failed to parse ${field}, deleting field`);
        delete req.body[field];
      }
    }
  }
  
  next();
};

router.post("/register", parseFormData, (req, res) => talentController.registerTalent(req, res));
router.post("/login", parseFormData, (req, res) => talentController.loginTalent(req, res));
router.post("/google-login", parseFormData, (req, res) => talentController.googleLoginTalent(req, res));

router.get("/profile/me", (req, res, next) => {
  
  next();
}, protect, (req, res) => {
  talentController.getCurrentUserProfile(req, res);
});


router.post('/upload-photo', protect, uploadImage.single('profilePicture'), (req, res, next) => {
  
  return talentController.uploadProfilePhoto(req, res, next);
});

router.get("/", (req, res) => talentController.getAllTalents(req, res));
router.get("/:id", (req, res) => talentController.getTalentById(req, res));


router.put("/:id", protect, uploadFiles.single('resume'), parseJsonFields, (req, res) => {

 
  
  return talentController.updateTalent(req, res);
});


router.post('/forgot-password', parseFormData, (req, res) => talentController.sendPasswordResetOtp(req, res));

router.post('/verify-otp', parseFormData, (req, res) => talentController.verifyOTP(req, res));

router.post('/reset-password', parseFormData, (req, res) => talentController.resetPassword(req, res));

router.post('/reset-password-legacy', parseFormData, (req, res) => talentController.verifyOtpAndResetPassword(req, res));

export default router;
