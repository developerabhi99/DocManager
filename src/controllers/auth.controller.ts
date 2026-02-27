import type { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { prisma } from "../config/db.js";
import {
  verifyPassword,
  generateToken,
} from "../utils/auth.js";

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
 
  const user = await prisma.user.findUnique({
    where: { email },
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

  console.log(user);

  if (!user || !user.isActive) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isValid = verifyPassword(password, user.salt, user.password);

  if (!isValid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = generateToken({
    userId: user.id,
    role: user.role.name,
  });

  const defaultImageUrl = "https://ui-avatars.com/api/?background=11047A&color=fff&name=";
  const imageUrl = user.imageUrl && user.imageUrl.trim() !== ""
    ? user.imageUrl
    : `${defaultImageUrl}${encodeURIComponent(user.name || user.email)}`;

  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name,
      imageUrl,
    },
  });
}

export async function updateUserImage(req: Request, res: Response) {
  const { id } = req.params;
  const authUser: any = (req as any).user;

  if (!authUser?.userId) {
    return res.status(401).json({ message: "Token missing" });
  }

  if (authUser.userId !== id && authUser.role !== "SUPER_ADMIN") {
    return res.status(403).json({ message: "Access denied" });
  }

  const image: string = req.body?.image;
  const fileName: string | undefined = req.body?.fileName;

  if (!image || typeof image !== "string") {
    return res.status(400).json({ message: "image is required" });
  }

  const dataUrlMatch = image.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!dataUrlMatch) {
    return res.status(400).json({ message: "Invalid image format" });
  }

  const mimeType = dataUrlMatch[1]!;
  const base64Data = dataUrlMatch[2]!;
  const ext = mimeType.split("/")[1] || "png";

  const buffer = Buffer.from(base64Data, "base64");
  if (!buffer.length) {
    return res.status(400).json({ message: "Invalid image data" });
  }

  const uploadsDir = path.resolve(process.cwd(), "uploads", "users");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const safeBase = (fileName || "profile")
    .replace(/[^a-zA-Z0-9-_\.]/g, "_")
    .slice(0, 40);
  const outFileName = `${id}-${Date.now()}-${safeBase}.${ext}`;
  const absolutePath = path.join(uploadsDir, outFileName);

  fs.writeFileSync(absolutePath, buffer);

  const hostHeader = req.headers.host;
  const host =
    typeof hostHeader === "string"
      ? hostHeader
      : Array.isArray(hostHeader)
        ? hostHeader[0] || ""
        : "";
  const publicUrl = `${req.protocol}://${host}/uploads/users/${outFileName}`;
  if (typeof id !== "string" || id.trim() === "") {
    return res.status(400).json({ message: "Invalid user id" });
  }
  const updated: any = await prisma.user.update({
    where: { id },
    data: { imageUrl: publicUrl },
    include: { role: true },
  });

  return res.json({
    user: {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role.name,
      imageUrl: updated.imageUrl,
    },
  });
}