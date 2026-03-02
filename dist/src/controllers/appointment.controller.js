import { prisma } from '../config/db.js';
export const createPatient = async (req, res) => {
    try {
        const { name, email, phone, address, age, gender } = req.body;
        const patient = await prisma.patient.create({
            data: { name, email, phone, address, age, gender },
        });
        res.json(patient);
    }
    catch (error) {
        console.error('createPatient error:', error);
        res.status(500).json({ error: 'Failed to create patient' });
    }
};
export const listPatients = async (req, res) => {
    try {
        const patients = await prisma.patient.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(patients);
    }
    catch (error) {
        console.error('listPatients error:', error);
        res.status(500).json({ error: 'Failed to fetch patients' });
    }
};
export const createAppointment = async (req, res) => {
    try {
        const { patientId, doctorId, dateTime, notes } = req.body;
        // Validate that the appointment time is in the future
        const appointmentTime = new Date(dateTime);
        console.log(req);
        if (appointmentTime <= new Date()) {
            return res.status(400).json({ error: 'Appointment time must be in the future' });
        }
        // Check if doctor is available at this time
        const dayOfWeek = appointmentTime.getDay();
        const appointmentStartTime = appointmentTime.toTimeString().slice(0, 5); // HH:MM format
        // Get doctor's schedule for this day
        const doctorSchedule = await prisma.doctorSchedule.findFirst({
            where: {
                doctorId,
                dayOfWeek,
                isAvailable: true,
                startTime: { lte: appointmentStartTime },
                endTime: { gt: appointmentStartTime }
            }
        });
        if (!doctorSchedule) {
            return res.status(400).json({ error: 'Doctor is not available at this time' });
        }
        // Check for existing appointments at the same time (30-minute slots)
        const slotStart = new Date(appointmentTime);
        slotStart.setMinutes(slotStart.getMinutes() - (slotStart.getMinutes() % 30), 0, 0);
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotStart.getMinutes() + 30);
        const conflictingAppointment = await prisma.appointment.findFirst({
            where: {
                doctorId,
                status: { in: ["PENDING_PAYMENT", "SCHEDULED"] },
                dateTime: {
                    gte: slotStart,
                    lt: slotEnd
                }
            }
        });
        if (conflictingAppointment) {
            return res.status(400).json({ error: 'This time slot is already booked' });
        }
        // Create the appointment
        const appointment = await prisma.appointment.create({
            data: {
                patientId,
                doctorId,
                dateTime: slotStart, // Round to nearest 30-minute slot
                notes,
                status: "PENDING_PAYMENT" // Set initial status to pending payment
            },
            include: {
                patient: true,
                doctor: { select: { id: true, name: true, email: true } }
            },
        });
        res.json(appointment);
    }
    catch (error) {
        console.error('createAppointment error:', error);
        res.status(500).json({ error: 'Failed to create appointment' });
    }
};
export const listAppointments = async (req, res) => {
    try {
        const appointments = await prisma.appointment.findMany({
            orderBy: { dateTime: 'desc' },
            include: {
                patient: true,
                doctor: { select: { id: true, name: true, email: true } },
            },
        });
        res.json(appointments);
    }
    catch (error) {
        console.error('listAppointments error:', error);
        res.status(500).json({ error: 'Failed to fetch appointments' });
    }
};
export const processPayment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { amount, paymentMethod } = req.body;
        if (!appointmentId || typeof appointmentId !== 'string') {
            return res.status(400).json({ error: 'Valid appointment ID is required' });
        }
        // Get appointment details
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: { patient: true }
        });
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        if (appointment.status !== "PENDING_PAYMENT") {
            return res.status(400).json({ error: 'Payment can only be processed for pending payment appointments' });
        }
        // Create transaction record
        const transaction = await prisma.transaction.create({
            data: {
                patientId: appointment.patientId,
                appointmentId: appointment.id,
                amount,
                paymentMethod,
                status: "PAID",
                description: `Payment for appointment on ${appointment.dateTime.toLocaleDateString()}`
            }
        });
        // Update appointment status to SCHEDULED
        const updatedAppointment = await prisma.appointment.update({
            where: { id: appointmentId },
            data: { status: "SCHEDULED" },
            include: {
                patient: true,
                doctor: { select: { id: true, name: true, email: true } }
            }
        });
        res.json({
            message: 'Payment processed successfully',
            transaction,
            appointment: updatedAppointment
        });
    }
    catch (error) {
        console.error('processPayment error:', error);
        res.status(500).json({ error: 'Failed to process payment' });
    }
};
export const completeAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        if (!appointmentId || typeof appointmentId !== 'string') {
            return res.status(400).json({ error: 'Valid appointment ID is required' });
        }
        // Handle both file upload and JSON data
        const { notes, diagnosis, symptoms, treatment, prescription } = req.body;
        let reportUrl = req.body.reportUrl;
        // Check if file was uploaded
        if (req.files && req.files.reportFile) {
            const reportFiles = req.files.reportFile;
            const reportFile = Array.isArray(reportFiles) ? reportFiles[0] : reportFiles;
            // For now, just return the filename - in production, you'd upload to cloud storage
            if (reportFile && 'originalname' in reportFile) {
                reportUrl = `/uploads/${reportFile.originalname}`;
                console.log('File uploaded:', reportFile);
            }
        }
        // Get appointment details
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId }
        });
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        if (appointment.status !== "SCHEDULED") {
            return res.status(400).json({ error: 'Only scheduled appointments can be completed' });
        }
        // Validate required fields
        if (!notes || !diagnosis || !reportUrl) {
            return res.status(400).json({
                error: 'Notes, diagnosis, and report are mandatory fields for completion'
            });
        }
        // Validate optional fields have meaningful content if provided
        if (symptoms && symptoms.trim() === '') {
            return res.status(400).json({
                error: 'Symptoms field cannot be empty when provided'
            });
        }
        if (treatment && treatment.trim() === '') {
            return res.status(400).json({
                error: 'Treatment field cannot be empty when provided'
            });
        }
        if (prescription && prescription.trim() === '') {
            return res.status(400).json({
                error: 'Prescription field cannot be empty when provided'
            });
        }
        // Create medical report
        const medicalReport = await prisma.medicalReport.create({
            data: {
                appointmentId: appointment.id,
                doctorId: appointment.doctorId,
                diagnosis,
                symptoms,
                treatment,
                prescription,
                notes,
                reportUrl
            }
        });
        // Update appointment status to COMPLETED
        const updatedAppointment = await prisma.appointment.update({
            where: { id: appointmentId },
            data: { status: "COMPLETED" },
            include: {
                patient: true,
                doctor: { select: { id: true, name: true, email: true } },
                reports: true
            }
        });
        res.json({
            message: 'Appointment completed successfully',
            appointment: updatedAppointment,
            medicalReport
        });
    }
    catch (error) {
        console.error('completeAppointment error:', error);
        res.status(500).json({ error: 'Failed to complete appointment' });
    }
};
export const referAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { referredTo, notes } = req.body;
        if (!appointmentId || typeof appointmentId !== 'string') {
            return res.status(400).json({ error: 'Valid appointment ID is required' });
        }
        // Get appointment details
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId }
        });
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        if (appointment.status !== "SCHEDULED") {
            return res.status(400).json({ error: 'Only scheduled appointments can be referred' });
        }
        // Validate required fields
        if (!referredTo || !notes) {
            return res.status(400).json({
                error: 'Referral target and notes are mandatory fields'
            });
        }
        // Validate referral target is not empty
        if (referredTo.trim() === '') {
            return res.status(400).json({
                error: 'Referral target cannot be empty'
            });
        }
        // Validate referral notes are meaningful
        if (notes.trim() === '') {
            return res.status(400).json({
                error: 'Referral notes cannot be empty'
            });
        }
        // Update appointment status to REFERRED
        const updatedAppointment = await prisma.appointment.update({
            where: { id: appointmentId },
            data: {
                status: "REFERRED",
                referredTo,
                notes
            },
            include: {
                patient: true,
                doctor: { select: { id: true, name: true, email: true } }
            }
        });
        res.json({
            message: 'Appointment referred successfully',
            appointment: updatedAppointment
        });
    }
    catch (error) {
        console.error('referAppointment error:', error);
        res.status(500).json({ error: 'Failed to refer appointment' });
    }
};
//# sourceMappingURL=appointment.controller.js.map