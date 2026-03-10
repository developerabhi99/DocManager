import { prisma } from "../config/db.js";
import { getPatientMedicalReportGroups, getMedicalReportGroupById, createMedicalReportGroup, updateMedicalReportGroup, getMedicalReportById as getMedicalReportByIdService, updateMedicalReport as updateMedicalReportService, getPatientVisitHistory, getAllMedicalReportGroups } from "../services/medicalReport.service.js";
// Create medical report with file upload
export async function createMedicalReportWithFile(req, res) {
    const { appointmentId, diagnosis, symptoms, treatment, prescription, notes } = req.body;
    const authUser = req.user;
    console.log("=== DEBUG: createMedicalReportWithFile called ===");
    console.log("appointmentId:", appointmentId);
    console.log("authUser:", authUser);
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        // Create file URL
        const fileUrl = `/uploads/${req.file.filename}`;
        // Verify the appointment exists and belongs to the doctor
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: {
                doctor: true,
                patient: true
            }
        });
        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }
        console.log("Appointment:", appointment);
        console.log("Auth user:", authUser);
        // Only the assigned doctor or Super Admin can create a report
        if (appointment.doctorId !== authUser.userId && authUser.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ message: "Only the assigned doctor can create a medical report" });
        }
        // Check if report already exists and update it, or create new one
        const existingReport = await prisma.medicalReport.findUnique({
            where: { appointmentId }
        });
        console.log("Existing report found:", !!existingReport);
        let report;
        if (existingReport) {
            console.log("Updating existing report...");
            // Update existing report
            report = await prisma.medicalReport.update({
                where: { id: existingReport.id },
                data: {
                    diagnosis,
                    symptoms,
                    treatment,
                    prescription,
                    notes,
                    reportUrl: fileUrl
                },
                include: {
                    appointment: {
                        include: {
                            patient: true,
                            doctor: true
                        }
                    }
                }
            });
        }
        else {
            console.log("Creating new report...");
            // Create new report
            report = await prisma.medicalReport.create({
                data: {
                    appointmentId,
                    doctorId: authUser.userId,
                    diagnosis,
                    symptoms,
                    treatment,
                    prescription,
                    notes,
                    reportUrl: fileUrl
                },
                include: {
                    appointment: {
                        include: {
                            patient: true,
                            doctor: true
                        }
                    }
                }
            });
        }
        console.log("Report saved successfully:", report.id);
        res.json(report);
    }
    catch (error) {
        console.error("createMedicalReportWithFile error:", error);
        res.status(500).json({ error: "Failed to create medical report" });
    }
}
// Create medical report after appointment completion
export async function createMedicalReport(req, res) {
    const { appointmentId, diagnosis, symptoms, treatment, prescription, notes, reportUrl } = req.body;
    const authUser = req.user;
    try {
        // Verify the appointment exists and belongs to the doctor
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: {
                doctor: true,
                patient: true
            }
        });
        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }
        // Only the assigned doctor or Super Admin can create a report
        if (appointment.doctorId !== authUser.userId && authUser.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ message: "Only the assigned doctor can create a medical report" });
        }
        // Check if report already exists and update it, or create new one
        const existingReport = await prisma.medicalReport.findUnique({
            where: { appointmentId }
        });
        let report;
        if (existingReport) {
            // Update existing report
            report = await prisma.medicalReport.update({
                where: { id: existingReport.id },
                data: {
                    diagnosis,
                    symptoms,
                    treatment,
                    prescription,
                    notes,
                    reportUrl
                },
                include: {
                    appointment: {
                        include: {
                            patient: true,
                            doctor: true
                        }
                    }
                }
            });
        }
        else {
            // Create new report
            report = await prisma.medicalReport.create({
                data: {
                    appointmentId,
                    doctorId: authUser.userId,
                    diagnosis,
                    symptoms,
                    treatment,
                    prescription,
                    notes,
                    reportUrl
                },
                include: {
                    appointment: {
                        include: {
                            patient: true,
                            doctor: true
                        }
                    }
                }
            });
        }
        res.json(report);
    }
    catch (error) {
        console.error("createMedicalReport error:", error);
        res.status(500).json({ error: "Failed to create medical report" });
    }
}
// Update medical report
export async function updateMedicalReport(req, res) {
    const { reportId } = req.params;
    const { diagnosis, symptoms, treatment, prescription, notes, reportUrl } = req.body;
    const authUser = req.user;
    try {
        // Verify the report exists and belongs to the doctor
        const existingReport = await prisma.medicalReport.findUnique({
            where: { id: reportId },
            include: {
                appointment: true
            }
        });
        if (!existingReport) {
            return res.status(404).json({ message: "Medical report not found" });
        }
        // Only the assigned doctor or Super Admin can update the report
        if (existingReport.doctorId !== authUser.userId && authUser.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ message: "Only the assigned doctor can update this medical report" });
        }
        const report = await prisma.medicalReport.update({
            where: { id: reportId },
            data: {
                diagnosis,
                symptoms,
                treatment,
                prescription,
                notes,
                reportUrl
            },
            include: {
                appointment: {
                    include: {
                        patient: true,
                        doctor: true
                    }
                }
            }
        });
        res.json(report);
    }
    catch (error) {
        console.error("updateMedicalReport error:", error);
        res.status(500).json({ error: "Failed to update medical report" });
    }
}
// Get medical report by appointment ID
export async function getMedicalReportByAppointment(req, res) {
    const { appointmentId } = req.params;
    try {
        const report = await prisma.medicalReport.findUnique({
            where: { appointmentId: appointmentId },
            include: {
                appointment: {
                    include: {
                        patient: true,
                        doctor: true
                    }
                }
            }
        });
        if (!report) {
            return res.status(404).json({ message: "Medical report not found" });
        }
        res.json(report);
    }
    catch (error) {
        console.error("getMedicalReportByAppointment error:", error);
        res.status(500).json({ error: "Failed to fetch medical report" });
    }
}
// Get all medical reports for a patient
export async function getPatientMedicalReports(req, res) {
    const { patientId } = req.params;
    try {
        const reports = await prisma.medicalReport.findMany({
            where: {
                appointment: {
                    patientId: patientId
                }
            },
            include: {
                appointment: {
                    include: {
                        doctor: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(reports);
    }
    catch (error) {
        console.error("getPatientMedicalReports error:", error);
        res.status(500).json({ error: "Failed to fetch medical reports" });
    }
}
// Refer patient to another doctor/department
export async function referPatient(req, res) {
    const { appointmentId, referredTo, notes } = req.body;
    const authUser = req.user;
    try {
        // Verify the appointment exists and belongs to the doctor
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: {
                doctor: true,
                patient: true
            }
        });
        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }
        // Only the assigned doctor or Super Admin can refer the patient
        if (appointment.doctorId !== authUser.userId && authUser.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ message: "Only the assigned doctor can refer this patient" });
        }
        // Update appointment status and referral info
        const updatedAppointment = await prisma.appointment.update({
            where: { id: appointmentId },
            data: {
                status: 'REFERRED',
                referredTo,
                notes: notes ? `${appointment.notes || ''}\n\nReferral Notes: ${notes}` : appointment.notes
            },
            include: {
                patient: true,
                doctor: true
            }
        });
        // Create a new appointment for the referral
        const newAppointment = await prisma.appointment.create({
            data: {
                patientId: appointment.patientId,
                doctorId: referredTo, // This could be a doctor ID or department ID
                dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
                status: 'SCHEDULED',
                visitNumber: appointment.visitNumber + 1,
                referredFrom: appointmentId,
                notes: `Referral from Dr. ${appointment.doctor.name}. ${notes || ''}`
            },
            include: {
                patient: true,
                doctor: true
            }
        });
        res.json({
            originalAppointment: updatedAppointment,
            referralAppointment: newAppointment
        });
    }
    catch (error) {
        console.error("referPatient error:", error);
        res.status(500).json({ error: "Failed to refer patient" });
    }
}
// Report Group Management Endpoints
export const getPatientReports = async (req, res) => {
    try {
        const { patientId } = req.params;
        if (!patientId || typeof patientId !== 'string') {
            return res.status(400).json({ error: 'Valid patient ID is required' });
        }
        const reportGroups = await getPatientMedicalReportGroups(patientId);
        res.json(reportGroups);
    }
    catch (error) {
        console.error('getPatientReports error:', error);
        res.status(500).json({ error: 'Failed to fetch patient reports' });
    }
};
export const getReportGroupDetails = async (req, res) => {
    try {
        const { reportGroupId } = req.params;
        if (!reportGroupId || typeof reportGroupId !== 'string') {
            return res.status(400).json({ error: 'Valid report group ID is required' });
        }
        const reportGroup = await getMedicalReportGroupById(reportGroupId);
        if (!reportGroup) {
            return res.status(404).json({ error: 'Report group not found' });
        }
        res.json(reportGroup);
    }
    catch (error) {
        console.error('getReportGroupDetails error:', error);
        res.status(500).json({ error: 'Failed to fetch report group details' });
    }
};
export const createReportGroup = async (req, res) => {
    try {
        const { patientId, title, description } = req.body;
        if (!patientId || !title) {
            return res.status(400).json({
                error: 'Patient ID and title are required fields'
            });
        }
        const reportGroup = await createMedicalReportGroup({
            patientId,
            title,
            description
        });
        res.status(201).json(reportGroup);
    }
    catch (error) {
        console.error('createReportGroup error:', error);
        res.status(500).json({ error: 'Failed to create report group' });
    }
};
export const updateReportGroup = async (req, res) => {
    try {
        const { reportGroupId } = req.params;
        const { title, description, status, endDate } = req.body;
        if (!reportGroupId || typeof reportGroupId !== 'string') {
            return res.status(400).json({ error: 'Valid report group ID is required' });
        }
        const updateData = {};
        if (title !== undefined)
            updateData.title = title;
        if (description !== undefined)
            updateData.description = description;
        if (status !== undefined)
            updateData.status = status;
        if (endDate !== undefined)
            updateData.endDate = new Date(endDate);
        const updatedGroup = await updateMedicalReportGroup(reportGroupId, updateData);
        if (!updatedGroup) {
            return res.status(404).json({ error: 'Report group not found' });
        }
        res.json(updatedGroup);
    }
    catch (error) {
        console.error('updateReportGroup error:', error);
        res.status(500).json({ error: 'Failed to update report group' });
    }
};
export const getMedicalReportById = async (req, res) => {
    try {
        const { reportId } = req.params;
        if (!reportId || typeof reportId !== 'string') {
            return res.status(400).json({ error: 'Valid report ID is required' });
        }
        const report = await getMedicalReportByIdService(reportId);
        if (!report) {
            return res.status(404).json({ error: 'Medical report not found' });
        }
        res.json(report);
    }
    catch (error) {
        console.error('getMedicalReportById error:', error);
        res.status(500).json({ error: 'Failed to fetch medical report' });
    }
};
export const updateMedicalReportEnhanced = async (req, res) => {
    try {
        const { reportId } = req.params;
        const { diagnosis, symptoms, treatment, prescription, notes, reportUrl, formData, vitalSigns, labResults, imaging, isReferred, referredTo, referralReason, referralNotes } = req.body;
        if (!reportId || typeof reportId !== 'string') {
            return res.status(400).json({ error: 'Valid report ID is required' });
        }
        const updateData = {};
        if (diagnosis !== undefined)
            updateData.diagnosis = diagnosis;
        if (symptoms !== undefined)
            updateData.symptoms = symptoms;
        if (treatment !== undefined)
            updateData.treatment = treatment;
        if (prescription !== undefined)
            updateData.prescription = prescription;
        if (notes !== undefined)
            updateData.notes = notes;
        if (reportUrl !== undefined)
            updateData.reportUrl = reportUrl;
        if (formData !== undefined)
            updateData.formData = formData;
        if (vitalSigns !== undefined)
            updateData.vitalSigns = vitalSigns;
        if (labResults !== undefined)
            updateData.labResults = labResults;
        if (imaging !== undefined)
            updateData.imaging = imaging;
        if (isReferred !== undefined)
            updateData.isReferred = isReferred;
        if (referredTo !== undefined)
            updateData.referredTo = referredTo;
        if (referralReason !== undefined)
            updateData.referralReason = referralReason;
        if (referralNotes !== undefined)
            updateData.referralNotes = referralNotes;
        const updatedReport = await updateMedicalReportService(reportId, updateData);
        if (!updatedReport) {
            return res.status(404).json({ error: 'Medical report not found' });
        }
        res.json(updatedReport);
    }
    catch (error) {
        console.error('updateMedicalReportEnhanced error:', error);
        res.status(500).json({ error: 'Failed to update medical report' });
    }
};
export const getPatientVisitHistoryController = async (req, res) => {
    try {
        const { patientId } = req.params;
        if (!patientId || typeof patientId !== 'string') {
            return res.status(400).json({ error: 'Valid patient ID is required' });
        }
        const visitHistory = await getPatientVisitHistory(patientId);
        res.json(visitHistory);
    }
    catch (error) {
        console.error('getPatientVisitHistoryController error:', error);
        res.status(500).json({ error: 'Failed to fetch patient visit history' });
    }
};
export const getAllReportGroups = async (req, res) => {
    try {
        const { status, patientId, startDate, endDate, page = '1', limit = '10' } = req.query;
        const filters = {};
        if (status && typeof status === 'string') {
            filters.status = status;
        }
        if (patientId && typeof patientId === 'string') {
            filters.patientId = patientId;
        }
        if (startDate && typeof startDate === 'string') {
            filters.startDate = new Date(startDate);
        }
        if (endDate && typeof endDate === 'string') {
            filters.endDate = new Date(endDate);
        }
        const reportGroups = await getAllMedicalReportGroups(filters);
        // Apply pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = startIndex + limitNum;
        const paginatedGroups = reportGroups.slice(startIndex, endIndex);
        res.json({
            reportGroups: paginatedGroups,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: reportGroups.length,
                pages: Math.ceil(reportGroups.length / limitNum)
            }
        });
    }
    catch (error) {
        console.error('getAllReportGroups error:', error);
        res.status(500).json({ error: 'Failed to fetch report groups' });
    }
};
export const getDashboardStats = async (req, res) => {
    try {
        const { patientId } = req.query;
        if (!patientId || typeof patientId !== 'string') {
            return res.status(400).json({ error: 'Valid patient ID is required' });
        }
        const reportGroups = await getPatientMedicalReportGroups(patientId);
        const visitHistory = await getPatientVisitHistory(patientId);
        // Calculate statistics
        const totalReportGroups = reportGroups.length;
        const activeGroups = reportGroups.filter(group => group.status === 'ACTIVE').length;
        const completedGroups = reportGroups.filter(group => group.status === 'COMPLETED').length;
        const totalVisits = visitHistory.length;
        const completedVisits = visitHistory.filter(visit => visit.status === 'COMPLETED').length;
        const referredVisits = visitHistory.filter(visit => visit.status === 'REFERRED').length;
        // Recent activity
        const recentReports = reportGroups
            .filter(group => group.reports.length > 0)
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, 5);
        res.json({
            stats: {
                totalReportGroups,
                activeGroups,
                completedGroups,
                totalVisits,
                completedVisits,
                referredVisits
            },
            recentReports
        });
    }
    catch (error) {
        console.error('getDashboardStats error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
};
//# sourceMappingURL=medicalReport.controller.js.map