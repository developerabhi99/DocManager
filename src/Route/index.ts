import express from "express";
import { login } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { hasPermission } from "../middleware/permission.middleware.js";

const router = express.Router();

router.post("/login", login);

router.get(
  "/users",
  authenticate,
  hasPermission("VIEW_USERS"),
  (req, res) => {
    res.json({ message: "Users list" });
  }
);

export default router;