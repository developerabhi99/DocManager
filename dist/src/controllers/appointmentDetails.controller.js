import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.middleware.js';
export async function getComprehensiveAppointmentDetails(req, res) {
    const { id } = req.params;
    const authUser = req.user;
    try {
        const appointmentId = Array.isArray(id) ? id[0] : id;
        if (!appointmentId) {
            return res.status(400).json({ error: 'Appointment ID is required' });
        }
        // Fetch comprehensive appointment details
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: {
                patient: true,
                doctor: {
                    include: {
                        department: true
                    }
                },
                reports: {
                    include: {
                        doctor: true
                    }
                }
            }
        });
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }
        // Check permissions - only assigned doctor, patient's doctor, or admin can view
        if (appointment.doctorId !== authUser.userId && authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Access denied' });
        }
        // Get medical report group information if available
        let medicalReportGroup = null;
        let allReportsInGroup = [];
        let referralChain = [];
        if (appointment.reports && appointment.reports.length > 0 && appointment.reports[0]?.medicalReportGroupId) {
            const reportGroupId = appointment.reports[0].medicalReportGroupId;
            // Get medical report group details
            medicalReportGroup = await prisma.medicalReportGroup.findUnique({
                where: { id: reportGroupId },
                include: {
                    reports: {
                        include: {
                            appointment: {
                                include: {
                                    doctor: true
                                }
                            },
                            doctor: true
                        }
                    }
                }
            });
            // Get all reports in the same medical report group (visit cycle)
            allReportsInGroup = await prisma.medicalReport.findMany({
                where: {
                    medicalReportGroupId: reportGroupId
                },
                include: {
                    appointment: {
                        include: {
                            doctor: true
                        }
                    },
                    doctor: true
                },
                orderBy: {
                    createdAt: 'asc'
                }
            });
            // Get referral chain information
            referralChain = await prisma.appointment.findMany({
                where: {
                    reports: {
                        some: {
                            medicalReportGroupId: reportGroupId
                        }
                    }
                },
                include: {
                    doctor: {
                        include: {
                            department: true
                        }
                    },
                    reports: true
                },
                orderBy: {
                    dateTime: 'asc'
                }
            });
        }
        // Get referred to doctor details
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
        // Get referred from appointment details
        let referredFromAppointment = null;
        if (appointment.referredFrom) {
            referredFromAppointment = await prisma.appointment.findUnique({
                where: { id: appointment.referredFrom },
                include: {
                    doctor: {
                        include: {
                            department: true
                        }
                    }
                }
            });
        }
        const response = {
            ...appointment,
            medicalReportGroup,
            referredToDoctor,
            referredFromAppointment,
            referralChain,
            allReportsInGroup,
            medicalReport: appointment.reports && appointment.reports.length > 0 ? appointment.reports[0] : null
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching appointment details:', error);
        res.status(500).json({ error: 'Failed to fetch appointment details' });
    }
}
//# sourceMappingURL=appointmentDetails.controller.js.map