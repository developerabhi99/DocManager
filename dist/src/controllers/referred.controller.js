import { prisma } from '../config/db.js';
export const getReferredAppointments = async (req, res) => {
    try {
        const appointments = await prisma.appointment.findMany({
            where: {
                status: 'REFERRED'
            },
            orderBy: { createdAt: 'desc' },
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
        console.error('getReferredAppointments error:', error);
        res.status(500).json({ error: 'Failed to fetch referred appointments' });
    }
};
export const updateAppointmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const appointmentId = Array.isArray(id) ? id[0] : id;
        if (!appointmentId) {
            return res.status(400).json({ error: 'Appointment ID is required' });
        }
        const appointment = await prisma.appointment.update({
            where: { id: appointmentId },
            data: { status },
            include: {
                patient: true,
                doctor: true
            }
        });
        res.json(appointment);
    }
    catch (error) {
        console.error('updateAppointmentStatus error:', error);
        res.status(500).json({ error: 'Failed to update appointment status' });
    }
};
//# sourceMappingURL=referred.controller.js.map