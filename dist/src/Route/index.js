import express from "express";
import { login, updateUserImage } from "../controllers/auth.controller.js";
import { createUser, updateUserProfile, createPermission, createRole, createUserType, listPermissions, listRoles, listUsers, listUserTypes, updateRolePermissions, } from "../controllers/admin.controller.js";
import { createPatient, createAppointment, listPatients, listAppointments, processPayment, completeAppointment, referAppointment, } from "../controllers/appointment.controller.js";
import { createTransaction, updateTransactionStatus, getPatientTransactions, getAllTransactions, getTransactionStats, refundTransaction, } from "../controllers/transaction.controller.js";
import { createMedicalReport, createMedicalReportWithFile, updateMedicalReport, getMedicalReportByAppointment, getPatientMedicalReports, } from "../controllers/medicalReport.controller.js";
import { createDepartment, getDepartments, getDepartmentById, updateDepartment, deleteDepartment, assignEmployeeToDepartment, removeEmployeeFromDepartment, getEmployeesWithoutDepartment, } from "../controllers/department.controller.js";
import { getMyAppointments, getAppointmentDetails, completeAppointment as completeMyAppointment, getPatientHistory, getDoctorSchedule, getDoctorsAndPatients, } from "../controllers/myAppointments.controller.js";
import { getDoctorSchedules, upsertDoctorSchedule, deleteDoctorSchedule, getDoctorAvailability, getAllDoctorSchedules, } from "../controllers/schedule.controller.js";
import { getEmployeeSchedules, upsertEmployeeSchedule, deleteEmployeeSchedule, getAllEmployeeSchedules, createDefaultSchedule, createDefaultSchedulesForAll, } from "../controllers/employeeSchedule.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { hasPermission } from "../middleware/permission.middleware.js";
import multer from "multer";
import { prisma } from "../config/db.js";
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    }
});
const router = express.Router();
router.post("/login", login);
router.put("/user/:id", authenticate, updateUserImage);
router.get("/users", authenticate, hasPermission("VIEW_USERS"), (req, res) => {
    res.json({ message: "Users list" });
});
router.get("/admin/users", authenticate, hasPermission("MANAGE_USERS"), listUsers);
router.post("/admin/users", authenticate, hasPermission("MANAGE_USERS"), createUser);
router.put("/admin/users/:id", authenticate, hasPermission("MANAGE_USERS"), updateUserProfile);
router.get("/admin/roles", authenticate, hasPermission(["MANAGE_USERS", "MANAGE_ROLES"]), listRoles);
router.get("/admin/permissions", authenticate, hasPermission(["MANAGE_USERS", "MANAGE_ROLES"]), listPermissions);
router.get("/admin/user-types", authenticate, hasPermission(["MANAGE_USERS", "MANAGE_ROLES"]), listUserTypes);
router.post("/admin/roles", authenticate, hasPermission("MANAGE_ROLES"), createRole);
router.put("/admin/roles/:roleId/permissions", authenticate, hasPermission("MANAGE_ROLES"), updateRolePermissions);
router.post("/admin/permissions", authenticate, hasPermission("MANAGE_ROLES"), createPermission);
router.post("/admin/user-types", authenticate, hasPermission("MANAGE_ROLES"), createUserType);
router.post("/admin/patients", authenticate, hasPermission("MANAGE_APPOINTMENTS"), createPatient);
router.get("/admin/patients", authenticate, hasPermission(["MANAGE_APPOINTMENTS"]), listPatients);
router.post("/admin/appointments", authenticate, hasPermission("MANAGE_APPOINTMENTS"), createAppointment);
router.get("/admin/appointments", authenticate, hasPermission(["MANAGE_APPOINTMENTS"]), listAppointments);
// Payment and appointment management routes
router.post("/appointments/:appointmentId/payment", authenticate, hasPermission("MANAGE_APPOINTMENTS"), processPayment);
router.post("/appointments/:appointmentId/complete", authenticate, hasPermission("MANAGE_APPOINTMENTS"), upload.single('reportFile'), (req, res) => completeAppointment(req, res));
router.post("/appointments/:appointmentId/refer", authenticate, hasPermission("MANAGE_APPOINTMENTS"), referAppointment);
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
router.get("/admin/transactions/stats", authenticate, hasPermission("MANAGE_USERS"), getTransactionStats);
router.post("/transactions/:transactionId/refund", authenticate, hasPermission("MANAGE_USERS"), refundTransaction);
// Medical report routes
router.post("/medical-reports", authenticate, upload.single('file'), createMedicalReportWithFile);
router.put("/medical-reports/:reportId", authenticate, updateMedicalReport);
router.get("/medical-reports/appointment/:appointmentId", authenticate, getMedicalReportByAppointment);
router.get("/patients/:patientId/medical-reports", authenticate, getPatientMedicalReports);
// File upload routes
router.post("/admin/upload-file", authenticate, hasPermission("MANAGE_APPOINTMENTS"), upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const fileUrl = `/uploads/${req.file.filename}`;
        const fileInfo = {
            filename: req.file.originalname,
            uploadedFile: req.file.filename,
            fileUrl: fileUrl,
            size: req.file.size,
            mimetype: req.file.mimetype,
            uploadDate: new Date().toISOString()
        };
        res.json({
            message: 'File uploaded successfully',
            ...fileInfo
        });
    }
    catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});
// My Appointments routes
router.get("/my-appointments", authenticate, getMyAppointments);
router.get("/admin/doctors-patients", authenticate, getDoctorsAndPatients);
router.get("/appointments/:appointmentId/details", authenticate, getAppointmentDetails);
router.get("/patients/:patientId/history", authenticate, getPatientHistory);
router.get("/doctor/schedule", authenticate, getDoctorSchedule);
// Department management routes
router.get("/admin/departments", authenticate, hasPermission("MANAGE_DEPARTMENTS"), getDepartments);
router.post("/admin/departments", authenticate, hasPermission("MANAGE_DEPARTMENTS"), createDepartment);
router.get("/admin/departments/:id", authenticate, hasPermission("MANAGE_DEPARTMENTS"), getDepartmentById);
router.put("/admin/departments/:id", authenticate, hasPermission("MANAGE_DEPARTMENTS"), updateDepartment);
router.delete("/admin/departments/:id", authenticate, hasPermission("MANAGE_DEPARTMENTS"), deleteDepartment);
router.post("/admin/departments/assign-employee", authenticate, hasPermission("MANAGE_DEPARTMENTS"), assignEmployeeToDepartment);
router.delete("/admin/departments/remove-employee/:userId", authenticate, hasPermission("MANAGE_DEPARTMENTS"), removeEmployeeFromDepartment);
router.get("/admin/employees/without-department", authenticate, hasPermission("MANAGE_DEPARTMENTS"), getEmployeesWithoutDepartment);
export default router;
//# sourceMappingURL=index.js.map