import { prisma } from "../config/db.js";
import type { AuthRequest } from "./auth.middleware.js";
import type { Response, NextFunction } from "express";

//const prisma = new PrismaClient();

export function hasPermission(permissionKey: string | string[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;

    if (!userId || typeof userId !== "string") {
      return res.status(401).json({ message: "Token missing" });
    }

    const required = Array.isArray(permissionKey)
      ? permissionKey
      : [permissionKey];

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

    const userPermissions: string[] = (user?.role?.permissions || []).map(
      (rp: any) => rp.permission?.key
    );
    //console.log("User permissions:", userPermissions);

    const allowed = required.some((k) => userPermissions.includes(k));
    //console.log("Allowed:", allowed);
    if (!allowed) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  };
}