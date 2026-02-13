import { NextFunction, Request, Response } from "express";

import z from "zod";
import { TalentUserService } from "../services/talentUser.service";
import { createTalentDto, loginTalentDto, verifyOtpAndResetPasswordDto, verifyOTPDto, resetPasswordDto } from "../dtos/talentUser.dto";
import { HttpError } from "../errors/http-error";
import asyncHandler from "../middlewares/async";
import { sendToPython } from "../services/python.service";
import { ExtractedCandidateModel } from "../models/extractedCandidate.model";

const talentUserService = new TalentUserService();

// Helper function to filter user data (excludes password)
const filterUserData = (user: any) => {
  if (!user) return null;
  const userData = user.toObject ? user.toObject() : user;
  
  // Return all fields except password
  const filtered: any = {
    _id: userData._id,
    fname: userData.fname,
    lname: userData.lname,
    email: userData.email,
    phoneNumber: userData.phoneNumber,
    dateOfBirth: userData.dateOfBirth,
    role: userData.role,
    profilePicturePath: userData.profilePicturePath,
    cvPath: userData.cvPath,
    googleId: userData.googleId,
    googleProfilePicture: userData.googleProfilePicture,
    location: userData.location,
    title: userData.title,
    summary: userData.summary,
    experiences: userData.experiences || [],
    education: userData.education || [],
    skills: userData.skills || [],
    certifications: userData.certifications || [],
    portfolio: userData.portfolio || [],
    links: userData.links || {},
    createdAt: userData.createdAt,
    updatedAt: userData.updatedAt,
  };
  
  // Remove password field if it exists
  delete filtered.password;
  
  return filtered;
};

const filterUsersArray = (users: any[]) => users.map(user => filterUserData(user));

export class TalentUserController {
  
  async registerTalent(req: Request, res: Response) {
    try {
      const parsedData = createTalentDto.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsedData.error),
        });
      }

      const newTalent = await talentUserService.registerTalent(parsedData.data);
      return res.status(201).json({
        success: true,
        message: "Talent registered successfully",
        data: filterUserData(newTalent),
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }


  async loginTalent(req: Request, res: Response) {
    try {
      const parsedData = loginTalentDto.safeParse(req.body);
      if (!parsedData.success) {
        throw new HttpError(400, "Invalid credentials");
      }

      const { token, talent } = await talentUserService.loginTalent(parsedData.data);
      return res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        data: filterUserData(talent),
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }


  async getAllTalents(req: Request, res: Response) {
    try {
      const talents = await talentUserService.getAllTalents();
      return res.status(200).json({
        success: true,
        data: filterUsersArray(talents),
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }


  async getTalentById(req: Request, res: Response) {
    try {
      const talent = await talentUserService.getTalentById(req.params.id);
      return res.status(200).json({
        success: true,
        data: filterUserData(talent),
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }


async updateTalent(req: Request, res: Response) {
  console.log("\n🔥🔥🔥 updateTalent controller HIT 🔥🔥🔥");
  console.log("Raw req.body type:", typeof req.body);
  console.log("Raw req.body:", JSON.stringify(req.body, null, 2));

  try {
    console.log("=== UPDATE TALENT START ===");
    
    if (req.file) {
      const { fieldname, filename, path } = req.file;
      console.log("📎 File received:", { fieldname, filename, path });

      if (fieldname === "resume") {
        req.body.cvPath = filename;
        console.log("✓ Resume uploaded:", filename);
      } else if (fieldname === "profilePicture") {
        req.body.profilePicturePath = filename;
        console.log("✓ Profile picture uploaded:", filename);
      }
    }

    // Fields that need JSON parsing from FormData
    const jsonFields = ["skills", "experiences", "education", "certifications", "portfolio", "links"];

    console.log(`\n🔍 Starting to parse ${jsonFields.length} JSON fields...`);

    // Parse all JSON string fields
    for (const field of jsonFields) {
      console.log(`\n▶ Processing field: ${field}`);
      console.log(`   Field exists in body?`, field in req.body);
      
      if (field in req.body) {
        const value = req.body[field];
        console.log(`   [${field}] Raw value:`, value);
        console.log(`   [${field}] Type:`, typeof value);
        console.log(`   [${field}] Constructor:`, value?.constructor?.name);

        // Skip if not a string (already parsed or doesn't exist)
        if (typeof value !== "string") {
          console.log(`   [${field}] ✓ Already parsed or not a string, keeping as-is`);
          continue;
        }

        // Handle empty strings
        if (value.trim() === "" || value === "[]" || value === "{}") {
          console.log(`   [${field}] ⚠ Empty/default value, setting to default array`);
          req.body[field] = [];
          console.log(`   [${field}] ✓ Set to:`, req.body[field]);
          continue;
        }

        // Try to parse
        try {
          console.log(`   [${field}] Attempting JSON.parse...`);
          const parsed = JSON.parse(value);
          console.log(`   [${field}] ✓ Parsed successfully:`, parsed);
          
          // Ensure it's an array or object, not a primitive
          if (Array.isArray(parsed) || typeof parsed === "object") {
            req.body[field] = parsed;
            console.log(`   [${field}] ✓ Assigned to body`);
          } else {
            console.log(`   [${field}] ⚠ Parsed value is not array/object, deleting`);
            delete req.body[field];
          }
        } catch (err) {
          console.log(`   [${field}] ✗ Parse failed:`, (err as Error).message);
          // If we can't parse it, don't send it to Mongoose
          delete req.body[field];
          console.log(`   [${field}] ✓ Deleted from body`);
        }
      }
    }

    console.log("\n📋 Final body before save:");
    console.log(JSON.stringify(req.body, null, 2));

    // Remove empty objects from arrays (optional strict mode)
    const cleanArrays = (data: any) => {
      const cleaner = (field: string) => {
        if (Array.isArray(data[field])) {
          const before = data[field].length;
          data[field] = data[field].filter((item: any) => {
            if (typeof item === "object" && item !== null) {
              // Check if object has at least one truthy property
              return Object.values(item).some(v => v && v !== "");
            }
            return !!item;
          });
          const after = data[field].length;
          console.log(`   [${field}] Cleaned: ${before} → ${after} items`);
        }
      };

      cleaner("experiences");
      cleaner("education");
      cleaner("certifications");
      cleaner("portfolio");
    };
    cleanArrays(req.body);

    console.log("\n📊 FINAL UPDATE BODY (about to save to DB):");
    console.log(JSON.stringify(req.body, null, 2));

    const updatedTalent = await talentUserService.updateTalent(
      req.params.id,
      req.body
    );

    // If resume uploaded, send to Python and store extracted candidate data
    if (req.file && req.file.fieldname === "resume") {
      const aiResult = await sendToPython({
        cvFilePath: req.file.path,
        candidateId: String(updatedTalent._id),
      });

      const extracted = aiResult?.data ?? aiResult?.pythonData ?? aiResult;
      if (extracted) {
        const extractedSkills = Array.isArray(extracted.skills)
          ? extracted.skills
          : typeof extracted.skills === "string"
            ? extracted.skills.split(", ")
            : [];

        const extractedCandidateData = {
          candidateId: String(updatedTalent._id),
          name: extracted.name || `${updatedTalent.fname} ${updatedTalent.lname}`.trim(),
          email: extracted.email || updatedTalent.email,
          phone: extracted.phone || updatedTalent.phoneNumber,
          skills: extractedSkills,
          raw_text: extracted.raw_text || "",
          cvPath: updatedTalent.cvPath || "",
        };

        await ExtractedCandidateModel.findOneAndUpdate(
          { candidateId: String(updatedTalent._id) },
          { $set: extractedCandidateData },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
    }

    console.log("=== ✅ UPDATE SUCCESS ===\n");

    return res.status(200).json({
      success: true,
      message: "Talent updated successfully",
      data: filterUserData(updatedTalent),
    });

  } catch (error: any) {
    console.error("\n=== ❌ UPDATE ERROR ===");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Full error:", error);
    console.error("=== END ERROR ===\n");
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
}



  // Get current logged-in user's profile
  async getCurrentUserProfile(req: Request, res: Response) {
    try {
      const userId = req.user._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized - User not found in token",
        });
      }

      const talent = await talentUserService.getTalentById(userId.toString());
      return res.status(200).json({
        success: true,
        data: filterUserData(talent),
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }


 uploadProfilePhoto = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    console.log('\n' + '='.repeat(70));
    console.log('📸 [CONTROLLER] uploadProfilePhoto - Processing image upload');
    console.log('='.repeat(70));

    // Check if file is present
    if (!req.file) {
      console.log('❌ No file in request');
      return res.status(400).json({
        success: false,
        statusCode: 400,
        data: { message: 'Please upload a photo file' },
      });
    }

    console.log('📎 File received in request');
    console.log('   - fieldname:', req.file.fieldname);
    console.log('   - filename:', req.file.filename);
    console.log('   - size:', req.file.size, 'bytes');
    console.log('   - path:', req.file.path);

    // Optional: check file size limit from env
    const maxFileUpload = parseInt(process.env.MAX_FILE_UPLOAD || '0', 10);
    if (maxFileUpload > 0 && req.file.size > maxFileUpload) {
      console.log('❌ ERROR: File too large');
      return res.status(400).json({
        success: false,
        statusCode: 400,
        data: { message: `Please upload an image less than ${maxFileUpload} bytes` },
      });
    }

    // Map file to body field
    if (req.file.fieldname === 'resume') {
      req.body.cvPath = req.file.filename;
      console.log('✓ Resume uploaded:', req.file.filename);
    } else if (req.file.fieldname === 'profilePicture') {
      req.body.profilePicturePath = req.file.filename;
      console.log('✓ Profile picture uploaded:', req.file.filename);
    } else {
      console.log('❌ Invalid file field:', req.file.fieldname);
      return res.status(400).json({
        success: false,
        statusCode: 400,
        data: { message: 'Invalid file type uploaded' },
      });
    }

    // Get current user ID (from auth middleware)
    const userId = req.user._id;
    console.log('✓ User ID:', userId);

    // Update user with profile picture
    const updatedUser = await talentUserService.updateTalent(userId, {
      profilePicturePath: req.file.filename,
    });

    console.log('✓ Profile photo saved:', req.file.filename);
    console.log('='.repeat(70) + '\n');

    res.status(200).json({
      success: true,
      data: updatedUser.profilePicturePath,
      message: 'Profile photo uploaded successfully',
    });
  }
);

  // Send password reset OTP
 async sendPasswordResetOtp(req: Request, res: Response) {
    try {
      // Validate request body
      const parsedData = z.object({
        email: z.string().min(1, "Email is required").email("Invalid email format"),
      }).safeParse(req.body);

      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: parsedData.error.format(), // use format() for readable errors
        });
      }

      // Call service
      const result = await talentUserService.sendPasswordResetOtp(parsedData.data);

      return res.status(200).json({
        success: true,
        message: result.message,
        data: { email: parsedData.data.email },
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  // Verify OTP (step 2 of password reset)
  async verifyOTP(req: Request, res: Response) {
    try {
      // Validate request
      const parsedData = verifyOTPDto.safeParse(req.body);

      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: parsedData.error.format(),
        });
      }

      // Call service
      const result = await talentUserService.verifyOTP(parsedData.data);

      return res.status(200).json({
        success: true,
        message: result.message,
        data: { email: result.email },
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

  // Reset password (step 3 of password reset)
  async resetPassword(req: Request, res: Response) {
    try {
      // Validate request
      const parsedData = resetPasswordDto.safeParse(req.body);

      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: parsedData.error.format(),
        });
      }

      // Call service
      const result = await talentUserService.resetPassword(parsedData.data);

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

 async verifyOtpAndResetPassword(req: Request, res: Response) {
    try {
      // Import DTO

      // Validate request
      const parsedData = verifyOtpAndResetPasswordDto.safeParse(req.body);

      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: parsedData.error.format(), // readable errors
        });
      }

      // Call service
      const result = await talentUserService.verifyOtpAndResetPassword(parsedData.data);

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  }

}