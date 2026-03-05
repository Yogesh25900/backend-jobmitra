import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import asyncHandler from "./async";
import { TalentUserModel } from "../models/talentUser_model";
import { AdminUserModel } from "../models/AdminUser.model";
import { JWT_SECRET } from "../config";
import { EmployerUserModel } from "../models/employerUser.model";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

interface DecodedToken extends JwtPayload {
  id: string;
}

const findUserById = async (id: string) => {
  return (
    (await TalentUserModel.findById(id)) ||
    (await EmployerUserModel.findById(id)) ||
    (await AdminUserModel.findById(id))
  );
};

export const protect = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    console.log('\n [PROTECT MIDDLEWARE] Checking authorization...');
    console.log('Path:', req.path);
    console.log(' Auth Header:', req.headers.authorization?.substring(0, 50));
    let token: string | undefined;
    const authHeader = req.headers.authorization?.toString();
    if (authHeader && authHeader.toLowerCase().startsWith("bearer")) {
      token = authHeader.split(" ")[1];
      console.log(' Token extracted from Authorization header');
    }

    if (!token) {
      console.log(' NO TOKEN FOUND - Returning 401');
      return res
        .status(401)
        .json({ message: "Not authorized to access this route" });
    }

    try {
      if (!JWT_SECRET) {
        return res
          .status(500)
          .json({ message: "JWT secret not configured on server" });
      }

      const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;

      const user = await findUserById(decoded.id);

      if (!user) {
        console.log(' User not found in database');
        return res
          .status(401)
          .json({ message: "Not authorized to access this route" });
      }

      console.log('User found:', {
        _id: user._id,
        email: user.email,
        role: user.role
      });
      
      req.user = user;
      (req as any).user.userId = user._id.toString();
      
      console.log('req.user.userId set to:', (req as any).user.userId);
      next();
    } catch (error) {
      return res
        .status(401)
        .json({ message: `Not authorized to access this route` });
    }
  }
);

export const authorize =
  (...roles: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({
        message: `User role ${req.user?.role} is not authorized to access this route`,
      });
    }
    next();
  };
