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
                status: "SCHEDULED",
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
                notes
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
//# sourceMappingURL=appointment.controller.js.map