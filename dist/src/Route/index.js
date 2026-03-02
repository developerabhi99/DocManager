import express from "express";
import { login, updateUserImage } from "../controllers/auth.controller.js";
import { createUser, createPermission, createRole, createUserType, listPermissions, listRoles, listUsers, listUserTypes, updateRolePermissions, } from "../controllers/admin.controller.js";
import { createPatient, createAppointment, listPatients, listAppointments, } from "../controllers/appointment.controller.js";
import { createTransaction, updateTransactionStatus, getPatientTransactions, getAllTransactions, } from "../controllers/transaction.controller.js";
import { createMedicalReport, updateMedicalReport, getMedicalReportByAppointment, getPatientMedicalReports, referPatient, } from "../controllers/medicalReport.controller.js";
import { getMyAppointments, getAppointmentDetails, completeAppointment, getPatientHistory, getDoctorSchedule, getDoctorsAndPatients, } from "../controllers/myAppointments.controller.js";
import { getDoctorSchedules, upsertDoctorSchedule, deleteDoctorSchedule, getDoctorAvailability, getAllDoctorSchedules, } from "../controllers/schedule.controller.js";
import { getEmployeeSchedules, upsertEmployeeSchedule, deleteEmployeeSchedule, getAllEmployeeSchedules, createDefaultSchedule, createDefaultSchedulesForAll, } from "../controllers/employeeSchedule.controller.js";
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
// Schedule management routes
router.get("/doctors/:doctorId/schedules", authenticate, getDoctorSchedules);
router.post("/doctors/:doctorId/schedules", authenticate, upsertDoctorSchedule);
router.delete("/doctors/:doctorId/schedules/:scheduleId", authenticate, deleteDoctorSchedule);
router.get("/doctors/:doctorId/availability", authenticate, getDoctorAvailability);
router.get("/admin/doctors/schedules", authenticate, hasPermission("MANAGE_USERS"), getAllDoctorSchedules);
// Employee schedule management routes
router.get("/employees/:userId/schedules", authenticate, getEmployeeSchedules);
router.post("/employees/:userId/schedules", authenticate, upsertEmployeeSchedule);
router.delete("/employees/:userId/schedules/:scheduleId", authenticate, deleteEmployeeSchedule);
router.get("/admin/employees/schedules", authenticate, hasPermission("MANAGE_USERS"), getAllEmployeeSchedules);
router.post("/admin/employees/:userId/default-schedule", authenticate, hasPermission("MANAGE_USERS"), createDefaultSchedule);
router.post("/admin/employees/create-default-schedules", authenticate, hasPermission("MANAGE_USERS"), createDefaultSchedulesForAll);
// Transaction management routes
router.post("/transactions", authenticate, createTransaction);
router.put("/transactions/:transactionId/status", authenticate, updateTransactionStatus);
router.get("/patients/:patientId/transactions", authenticate, getPatientTransactions);
router.get("/admin/transactions", authenticate, hasPermission("MANAGE_USERS"), getAllTransactions);
// Medical report routes
router.post("/medical-reports", authenticate, createMedicalReport);
router.put("/medical-reports/:reportId", authenticate, updateMedicalReport);
router.get("/appointments/:appointmentId/medical-report", authenticate, getMedicalReportByAppointment);
router.get("/patients/:patientId/medical-reports", authenticate, getPatientMedicalReports);
router.post("/appointments/:appointmentId/refer", authenticate, referPatient);
// My Appointments routes
router.get("/my-appointments", authenticate, getMyAppointments);
router.get("/admin/doctors-patients", authenticate, getDoctorsAndPatients);
router.get("/appointments/:appointmentId/details", authenticate, getAppointmentDetails);
router.post("/appointments/:appointmentId/complete", authenticate, completeAppointment);
router.get("/patients/:patientId/history", authenticate, getPatientHistory);
router.get("/doctor/schedule", authenticate, getDoctorSchedule);
export default router;
//# sourceMappingURL=index.js.map