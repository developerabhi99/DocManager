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

  if (!token || token === 'undefined' || token === 'null') {
    return res.status(401).json({ message: "Token missing" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    // Only log for debugging if it's not a common JWT error
    if (!(error as Error).message.includes('malformed') && !(error as Error).message.includes('invalid signature')) {
      console.log('Token verification failed:', (error as Error).message);
    }
    return res.status(401).json({ message: "Invalid token" });
  }
}