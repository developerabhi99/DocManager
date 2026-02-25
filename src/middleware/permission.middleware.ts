import { prisma } from "../config/db.js";
import type { AuthRequest } from "./auth.middleware.js";
import type { Response, NextFunction } from "express";

//const prisma = new PrismaClient();

export function hasPermission(permissionKey: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    const allowed = user?.role.permissions.some(
      (rp: any) => rp.permission.key === permissionKey
    );

    if (!allowed) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  };
}