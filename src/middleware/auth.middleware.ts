import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export interface AuthRequest extends Request {
  user?: any;
}

export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token missing" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token missing" });
  }

  try {
    // console.log('Attempting to verify token:', token.substring(0, 20) + '...');
    // console.log('JWT_SECRET exists:', !!JWT_SECRET);
    // console.log('JWT_SECRET length:', JWT_SECRET.length);
    const decoded = jwt.verify(token, JWT_SECRET);
    // console.log('Token verified successfully:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.log('Token verification failed:', (error as Error).message);
    return res.status(401).json({ message: "Invalid token" });
  }
}