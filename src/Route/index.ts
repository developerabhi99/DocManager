import express from "express";
import { login, updateUserImage } from "../controllers/auth.controller.js";
import {
  createUser,
  createPermission,
  createRole,
  createUserType,
  listPermissions,
  listRoles,
  listUsers,
  listUserTypes,
  updateRolePermissions,
} from "../controllers/admin.controller.js";
import {
  createPatient,
  createAppointment,
  listPatients,
  listAppointments,
  processPayment,
  completeAppointment,
  referAppointment,
} from "../controllers/appointment.controller.js";
import {
  createTransaction,
  updateTransactionStatus,
  getPatientTransactions,
  getAllTransactions,
  getTransactionStats,
  refundTransaction,
} from "../controllers/transaction.controller.js";
import {
  createMedicalReport,
  updateMedicalReport,
  getMedicalReportByAppointment,
  getPatientMedicalReports,
  referPatient,
} from "../controllers/medicalReport.controller.js";
import {
  getMyAppointments,
  getAppointmentDetails,
  completeAppointment as completeMyAppointment,
  getPatientHistory,
  getDoctorSchedule,
  getDoctorsAndPatients,
} from "../controllers/myAppointments.controller.js";
import {
  getDoctorSchedules,
  upsertDoctorSchedule,
  deleteDoctorSchedule,
  getDoctorAvailability,
  getAllDoctorSchedules,
} from "../controllers/schedule.controller.js";
import {
  getEmployeeSchedules,
  upsertEmployeeSchedule,
  deleteEmployeeSchedule,
  getAllEmployeeSchedules,
  createDefaultSchedule,
  createDefaultSchedulesForAll,
} from "../controllers/employeeSchedule.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { hasPermission } from "../middleware/permission.middleware.js";
import { upload } from "../index.js";

interface MulterRequest extends Express.Request {
  files?: {
    [fieldname: string]: Express.Multer.File[];
  } | undefined;
  body?: any;
  params?: any;
}

const router = express.Router();

router.post("/login", login);

router.put("/user/:id", authenticate, updateUserImage);

router.get(
  "/users",
  authenticate,
  hasPermission("VIEW_USERS"),
  (req, res) => {
    res.json({ message: "Users list" });
  }
);

router.get("/admin/users", authenticate, hasPermission("MANAGE_USERS"), listUsers);
router.post(
  "/admin/users",
  authenticate,
  hasPermission("MANAGE_USERS"),
  createUser
);
router.get(
  "/admin/roles",
  authenticate,
  hasPermission(["MANAGE_USERS", "MANAGE_ROLES"]),
  listRoles
);
router.get(
  "/admin/permissions",
  authenticate,
  hasPermission(["MANAGE_USERS", "MANAGE_ROLES"]),
  listPermissions
);
router.get(
  "/admin/user-types",
  authenticate,
  hasPermission(["MANAGE_USERS", "MANAGE_ROLES"]),
  listUserTypes
);

router.post(
  "/admin/roles",
  authenticate,
  hasPermission("MANAGE_ROLES"),
  createRole
);
router.put(
  "/admin/roles/:roleId/permissions",
  authenticate,
  hasPermission("MANAGE_ROLES"),
  updateRolePermissions
);
router.post(
  "/admin/permissions",
  authenticate,
  hasPermission("MANAGE_ROLES"),
  createPermission
);
router.post(
  "/admin/user-types",
  authenticate,
  hasPermission("MANAGE_ROLES"),
  createUserType
);

router.post(
  "/admin/patients",
  authenticate,
  hasPermission("CREATE_APPOINTMENT"),
  createPatient
);
router.get(
  "/admin/patients",
  authenticate,
  hasPermission(["CREATE_APPOINTMENT", "MANAGE_APPOINTMENT"]),
  listPatients
);
router.post(
  "/admin/appointments",
  authenticate,
  hasPermission("CREATE_APPOINTMENT"),
  createAppointment
);
router.get(
  "/admin/appointments",
  authenticate,
  hasPermission(["CREATE_APPOINTMENT", "MANAGE_APPOINTMENT"]),
  listAppointments
);

// Payment and appointment management routes
router.post(
  "/appointments/:appointmentId/payment",
  authenticate,
  hasPermission("MANAGE_APPOINTMENT"),
  processPayment
);
router.post(
  "/appointments/:appointmentId/complete",
  authenticate,
  hasPermission("MANAGE_APPOINTMENT"),
  upload.single('reportFile'),
  (req: any, res: any) => completeAppointment(req as MulterRequest, res)
);
router.post(
  "/appointments/:appointmentId/refer",
  authenticate,
  hasPermission("MANAGE_APPOINTMENT"),
  referAppointment
);

// Schedule management routes
router.get(
  "/doctors/:doctorId/schedules",
  authenticate,
  getDoctorSchedules
);
router.post(
  "/doctors/:doctorId/schedules",
  authenticate,
  upsertDoctorSchedule
);
router.delete(
  "/doctors/:doctorId/schedules/:scheduleId",
  authenticate,
  deleteDoctorSchedule
);
router.get(
  "/doctors/:doctorId/availability",
  authenticate,
  getDoctorAvailability
);
router.get(
  "/admin/doctors/schedules",
  authenticate,
  hasPermission("MANAGE_USERS"),
  getAllDoctorSchedules
);

// Employee schedule management routes
router.get(
  "/employees/:userId/schedules",
  authenticate,
  getEmployeeSchedules
);
router.post(
  "/employees/:userId/schedules",
  authenticate,
  upsertEmployeeSchedule
);
router.delete(
  "/employees/:userId/schedules/:scheduleId",
  authenticate,
  deleteEmployeeSchedule
);
router.get(
  "/admin/employees/schedules",
  authenticate,
  hasPermission("MANAGE_USERS"),
  getAllEmployeeSchedules
);
router.post(
  "/admin/employees/:userId/default-schedule",
  authenticate,
  hasPermission("MANAGE_USERS"),
  createDefaultSchedule
);
router.post(
  "/admin/employees/create-default-schedules",
  authenticate,
  hasPermission("MANAGE_USERS"),
  createDefaultSchedulesForAll
);

// Transaction management routes
router.post(
  "/transactions",
  authenticate,
  createTransaction
);
router.put(
  "/transactions/:transactionId/status",
  authenticate,
  updateTransactionStatus
);
router.get(
  "/patients/:patientId/transactions",
  authenticate,
  getPatientTransactions
);
router.get(
  "/admin/transactions",
  authenticate,
  hasPermission("MANAGE_USERS"),
  getAllTransactions
);
router.get(
  "/admin/transactions/stats",
  authenticate,
  hasPermission("MANAGE_USERS"),
  getTransactionStats
);
router.post(
  "/transactions/:transactionId/refund",
  authenticate,
  hasPermission("MANAGE_USERS"),
  refundTransaction
);

// Medical report routes
router.post(
  "/medical-reports",
  authenticate,
  createMedicalReport
);

// My Appointments routes
router.get(
  "/my-appointments",
  authenticate,
  getMyAppointments
);
router.get(
  "/admin/doctors-patients",
  authenticate,
  getDoctorsAndPatients
);
router.get(
  "/appointments/:appointmentId/details",
  authenticate,
  getAppointmentDetails
);
router.get(
  "/patients/:patientId/history",
  authenticate,
  getPatientHistory
);
router.get(
  "/doctor/schedule",
  authenticate,
  getDoctorSchedule
);

export default router;