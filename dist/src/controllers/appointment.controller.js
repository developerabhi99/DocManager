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
                doctor: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        department: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                },
            },
        });
        // Fetch referred-to doctor details for appointments that have referrals
        const appointmentsWithReferralDetails = await Promise.all(appointments.map(async (appointment) => {
            let referredToDoctor = null;
            if (appointment.referredTo) {
                referredToDoctor = await prisma.user.findUnique({
                    where: { id: appointment.referredTo },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        department: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                });
            }
            return {
                ...appointment,
                referredToDoctor
            };
        }));
        res.json(appointmentsWithReferralDetails);
    }
    catch (error) {
        console.error('listAppointments error:', error);
        res.status(500).json({ error: 'Failed to fetch appointments' });
    }
};
export const listDoctors = async (req, res) => {
    try {
        const doctors = await prisma.user.findMany({
            where: {
                isActive: true,
                role: {
                    name: 'DOCTOR'
                }
            },
            include: {
                department: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                _count: true
            },
            orderBy: { name: 'asc' }
        });
        res.json(doctors);
    }
    catch (error) {
        console.error('listDoctors error:', error);
        res.status(500).json({ error: 'Failed to fetch doctors' });
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
        // Check if payment can be processed (only for pending payment appointments)
        if (appointment.status !== "PENDING_PAYMENT") {
            return res.status(400).json({ error: 'Payment can only be processed for pending payment appointments. Please schedule the appointment first.' });
        }
        // Create transaction record
        const transaction = await prisma.transaction.create({
            data: {
                patientId: appointment.patientId,
                appointmentId: appointment.id,
                amount,
                paymentMethod,
                status: "PAID",
                description: `Payment for appointment on ${appointment.dateTime?.toLocaleDateString() || 'scheduled appointment'}`
            }
        });
        // Update appointment status to SCHEDULED after successful payment
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
        const { notes, diagnosis, symptoms, treatment, prescription, formData, vitalSigns, labResults, imaging, isReferred, referredTo, referralReason, referralNotes, medicalReportGroupId } = req.body;
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
            where: { id: appointmentId },
            include: { patient: true }
        });
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        if (appointment.status !== "SCHEDULED") {
            return res.status(400).json({ error: 'Only scheduled appointments can be completed' });
        }
        // Validate required fields
        if (!notes || !diagnosis) {
            return res.status(400).json({
                error: 'Notes and diagnosis are mandatory fields for completion'
            });
        }
        // Parse JSON fields if they are strings
        const parsedFormData = formData && typeof formData === 'string' ? JSON.parse(formData) : formData;
        const parsedVitalSigns = vitalSigns && typeof vitalSigns === 'string' ? JSON.parse(vitalSigns) : vitalSigns;
        const parsedLabResults = labResults && typeof labResults === 'string' ? JSON.parse(labResults) : labResults;
        const parsedImaging = imaging && typeof imaging === 'string' ? JSON.parse(imaging) : imaging;
        // Calculate visit number for this patient
        const patientAppointments = await prisma.appointment.findMany({
            where: {
                patientId: appointment.patientId,
                status: { in: ["COMPLETED", "REFERRED"] }
            },
            orderBy: { createdAt: 'asc' }
        });
        const visitNumber = patientAppointments.length + 1;
        // Create or update medical report group
        let reportGroupId = medicalReportGroupId;
        if (!reportGroupId && !isReferred) {
            // Create new medical report group for first visit
            const reportGroup = await prisma.medicalReportGroup.create({
                data: {
                    patientId: appointment.patientId,
                    title: diagnosis.length > 50 ? diagnosis.substring(0, 50) + '...' : diagnosis,
                    description: `Initial treatment for: ${diagnosis}`,
                    status: "ACTIVE"
                }
            });
            reportGroupId = reportGroup.id;
        }
        // Check if medical report already exists for this appointment
        const existingReport = await prisma.medicalReport.findUnique({
            where: { appointmentId: appointment.id }
        });
        let medicalReport;
        if (existingReport) {
            // Update existing report
            medicalReport = await prisma.medicalReport.update({
                where: { id: existingReport.id },
                data: {
                    diagnosis,
                    symptoms,
                    treatment,
                    prescription,
                    notes,
                    reportUrl,
                    formData: parsedFormData,
                    vitalSigns: parsedVitalSigns,
                    labResults: parsedLabResults,
                    imaging: parsedImaging,
                    isReferred: isReferred || false,
                    referredTo: isReferred ? referredTo : null,
                    referralReason: isReferred ? referralReason : null,
                    referralNotes: isReferred ? referralNotes : null
                }
            });
        }
        else {
            // Create new medical report
            medicalReport = await prisma.medicalReport.create({
                data: {
                    appointmentId: appointment.id,
                    doctorId: appointment.doctorId,
                    medicalReportGroupId: reportGroupId,
                    diagnosis,
                    symptoms,
                    treatment,
                    prescription,
                    notes,
                    reportUrl,
                    formData: parsedFormData,
                    vitalSigns: parsedVitalSigns,
                    labResults: parsedLabResults,
                    imaging: parsedImaging,
                    isReferred: isReferred || false,
                    referredTo: isReferred ? referredTo : null,
                    referralReason: isReferred ? referralReason : null,
                    referralNotes: isReferred ? referralNotes : null
                }
            });
        }
        // Update appointment status and visit number
        const updatedAppointment = await prisma.appointment.update({
            where: { id: appointmentId },
            data: {
                status: isReferred ? "REFERRED" : "COMPLETED",
                visitNumber,
                referredTo: isReferred ? referredTo : null
            },
            include: {
                patient: true,
                doctor: { select: { id: true, name: true, email: true } },
                reports: true
            }
        });
        res.json({
            message: `Appointment ${isReferred ? 'referred' : 'completed'} successfully`,
            appointment: updatedAppointment,
            medicalReport,
            medicalReportGroupId: reportGroupId
        });
    }
    catch (error) {
        console.error('completeAppointment error:', error);
        res.status(500).json({ error: 'Failed to complete appointment' });
    }
};
export const createReferralAppointment = async (req, res) => {
    try {
        const { patientId, doctorId, dateTime, notes, referredFrom, medicalReportGroupId } = req.body;
        // Validate that the appointment time is in the future
        const appointmentTime = new Date(dateTime);
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
        // Calculate visit number for this patient within their medical report group
        let visitNumber = 1;
        // If this is a referral, get the medical report group from the referred appointment
        if (referredFrom) {
            const referredAppointment = await prisma.appointment.findUnique({
                where: { id: referredFrom },
                include: {
                    reports: {
                        where: { appointmentId: referredFrom },
                        take: 1,
                        select: { medicalReportGroupId: true }
                    }
                }
            });
            if (referredAppointment && referredAppointment.reports && referredAppointment.reports.length > 0) {
                const firstReport = referredAppointment.reports[0];
                if (firstReport && firstReport.medicalReportGroupId) {
                    const reportGroupId = firstReport.medicalReportGroupId;
                    // Count appointments in this medical report group
                    const groupAppointments = await prisma.appointment.findMany({
                        where: {
                            patientId,
                            reports: {
                                some: {
                                    medicalReportGroupId: reportGroupId
                                }
                            },
                            status: { in: ["COMPLETED", "REFERRED"] }
                        },
                        orderBy: { createdAt: 'asc' }
                    });
                    visitNumber = groupAppointments.length + 1;
                    // Store the report group ID for later use
                    const medicalReportGroupId = reportGroupId;
                    // Create the appointment
                    const appointment = await prisma.appointment.create({
                        data: {
                            patientId,
                            doctorId,
                            dateTime: slotStart, // Round to nearest 30-minute slot
                            notes,
                            status: "PENDING_PAYMENT",
                            visitNumber,
                            referredFrom // Link to previous appointment
                        },
                        include: {
                            patient: true,
                            doctor: { select: { id: true, name: true, email: true } }
                        }
                    });
                    // Create a medical report for the new appointment to maintain the group connection
                    await prisma.medicalReport.create({
                        data: {
                            appointmentId: appointment.id,
                            doctorId: doctorId,
                            medicalReportGroupId: medicalReportGroupId,
                            diagnosis: "Referral appointment - pending completion",
                            notes: `Referral appointment from ${referredFrom}`
                        }
                    });
                    res.json({
                        appointment,
                        medicalReportGroupId,
                        visitNumber
                    });
                    return;
                }
            }
        }
        else {
            // For non-referral appointments, count all patient appointments
            const patientAppointments = await prisma.appointment.findMany({
                where: {
                    patientId,
                    status: { in: ["COMPLETED", "REFERRED"] }
                },
                orderBy: { createdAt: 'asc' }
            });
            visitNumber = patientAppointments.length + 1;
        }
        // Create the appointment for non-referral cases
        const appointment = await prisma.appointment.create({
            data: {
                patientId,
                doctorId,
                dateTime: slotStart, // Round to nearest 30-minute slot
                notes,
                status: "PENDING_PAYMENT",
                visitNumber,
                referredFrom // Link to previous appointment
            },
            include: {
                patient: true,
                doctor: { select: { id: true, name: true, email: true } }
            }
        });
        res.json({
            appointment,
            medicalReportGroupId: null,
            visitNumber
        });
    }
    catch (error) {
        console.error('createReferralAppointment error:', error);
        res.status(500).json({ error: 'Failed to create referral appointment' });
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