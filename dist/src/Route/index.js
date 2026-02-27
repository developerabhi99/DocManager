import express from "express";
import { login, updateUserImage } from "../controllers/auth.controller.js";
import { createUser, createPermission, createRole, createUserType, listPermissions, listRoles, listUsers, listUserTypes, updateRolePermissions, } from "../controllers/admin.controller.js";
import { createPatient, createAppointment, listPatients, listAppointments, } from "../controllers/appointment.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { hasPermission } from "../middleware/permission.middleware.js";
const router = express.Router();
router.post("/login", login);
router.put("/user/:id", authenticate, updateUserImage);
router.get("/users", authenticate, hasPermission("VIEW_USERS"), (req, res) => {
    res.json({ message: "Users list" });
});
router.get("/admin/users", authenticate, hasPermission("MANAGE_USERS"), listUsers);
router.post("/admin/users", authenticate, hasPermission("MANAGE_USERS"), createUser);
router.get("/admin/roles", authenticate, hasPermission(["MANAGE_USERS", "MANAGE_ROLES"]), listRoles);
router.get("/admin/permissions", authenticate, hasPermission(["MANAGE_USERS", "MANAGE_ROLES"]), listPermissions);
router.get("/admin/user-types", authenticate, hasPermission(["MANAGE_USERS", "MANAGE_ROLES"]), listUserTypes);
router.post("/admin/roles", authenticate, hasPermission("MANAGE_ROLES"), createRole);
router.put("/admin/roles/:roleId/permissions", authenticate, hasPermission("MANAGE_ROLES"), updateRolePermissions);
router.post("/admin/permissions", authenticate, hasPermission("MANAGE_ROLES"), createPermission);
router.post("/admin/user-types", authenticate, hasPermission("MANAGE_ROLES"), createUserType);
router.post("/admin/patients", authenticate, hasPermission("CREATE_APPOINTMENT"), createPatient);
router.get("/admin/patients", authenticate, hasPermission(["CREATE_APPOINTMENT", "MANAGE_APPOINTMENT"]), listPatients);
router.post("/admin/appointments", authenticate, hasPermission("CREATE_APPOINTMENT"), createAppointment);
router.get("/admin/appointments", authenticate, hasPermission(["CREATE_APPOINTMENT", "MANAGE_APPOINTMENT"]), listAppointments);
export default router;
//# sourceMappingURL=index.js.map