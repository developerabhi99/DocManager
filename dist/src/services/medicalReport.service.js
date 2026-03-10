import { prisma } from '../config/db.js';
export const getPatientMedicalReportGroups = async (patientId) => {
    try {
        const reportGroups = await prisma.medicalReportGroup.findMany({
            where: { patientId },
            include: {
                reports: {
                    include: {
                        appointment: {
                            include: {
                                patient: true,
                                doctor: { select: { id: true, name: true, email: true } }
                            }
                        },
                        doctor: { select: { id: true, name: true, email: true } }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return reportGroups;
    }
    catch (error) {
        console.error('getPatientMedicalReportGroups error:', error);
        throw error;
    }
};
export const getMedicalReportGroupById = async (reportGroupId) => {
    try {
        const reportGroup = await prisma.medicalReportGroup.findUnique({
            where: { id: reportGroupId },
            include: {
                patient: true,
                reports: {
                    include: {
                        appointment: {
                            include: {
                                doctor: { select: { id: true, name: true, email: true } }
                            }
                        },
                        doctor: { select: { id: true, name: true, email: true } }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });
        return reportGroup;
    }
    catch (error) {
        console.error('getMedicalReportGroupById error:', error);
        throw error;
    }
};
export const createMedicalReportGroup = async (data) => {
    try {
        const reportGroup = await prisma.medicalReportGroup.create({
            data: {
                patientId: data.patientId,
                title: data.title,
                description: data.description || null,
                status: "ACTIVE"
            },
            include: {
                patient: true
            }
        });
        return reportGroup;
    }
    catch (error) {
        console.error('createMedicalReportGroup error:', error);
        throw error;
    }
};
export const updateMedicalReportGroup = async (reportGroupId, data) => {
    try {
        const updatedGroup = await prisma.medicalReportGroup.update({
            where: { id: reportGroupId },
            data,
            include: {
                patient: true,
                reports: {
                    include: {
                        appointment: {
                            include: {
                                doctor: { select: { id: true, name: true, email: true } }
                            }
                        },
                        doctor: { select: { id: true, name: true, email: true } }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });
        return updatedGroup;
    }
    catch (error) {
        console.error('updateMedicalReportGroup error:', error);
        throw error;
    }
};
export const getMedicalReportById = async (reportId) => {
    try {
        const report = await prisma.medicalReport.findUnique({
            where: { id: reportId },
            include: {
                appointment: {
                    include: {
                        patient: true,
                        doctor: { select: { id: true, name: true, email: true } }
                    }
                },
                doctor: { select: { id: true, name: true, email: true } },
                medicalReportGroup: true
            }
        });
        return report;
    }
    catch (error) {
        console.error('getMedicalReportById error:', error);
        throw error;
    }
};
export const updateMedicalReport = async (reportId, data) => {
    try {
        const updatedReport = await prisma.medicalReport.update({
            where: { id: reportId },
            data,
            include: {
                appointment: {
                    include: {
                        patient: true,
                        doctor: { select: { id: true, name: true, email: true } }
                    }
                },
                doctor: { select: { id: true, name: true, email: true } },
                medicalReportGroup: true
            }
        });
        return updatedReport;
    }
    catch (error) {
        console.error('updateMedicalReport error:', error);
        throw error;
    }
};
export const getPatientVisitHistory = async (patientId) => {
    try {
        const appointments = await prisma.appointment.findMany({
            where: { patientId },
            include: {
                patient: true,
                doctor: { select: { id: true, name: true, email: true } },
                reports: {
                    include: {
                        medicalReportGroup: true,
                        doctor: { select: { id: true, name: true, email: true } }
                    }
                }
            },
            orderBy: { dateTime: 'desc' }
        });
        return appointments;
    }
    catch (error) {
        console.error('getPatientVisitHistory error:', error);
        throw error;
    }
};
export const getAllMedicalReportGroups = async (filters) => {
    try {
        const where = {};
        if (filters?.status) {
            where.status = filters.status;
        }
        if (filters?.patientId) {
            where.patientId = filters.patientId;
        }
        if (filters?.startDate || filters?.endDate) {
            where.createdAt = {};
            if (filters?.startDate) {
                where.createdAt.gte = filters.startDate;
            }
            if (filters?.endDate) {
                where.createdAt.lte = filters.endDate;
            }
        }
        const reportGroups = await prisma.medicalReportGroup.findMany({
            where,
            include: {
                patient: true,
                reports: {
                    include: {
                        appointment: {
                            include: {
                                doctor: { select: { id: true, name: true, email: true } }
                            }
                        },
                        doctor: { select: { id: true, name: true, email: true } }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return reportGroups;
    }
    catch (error) {
        console.error('getAllMedicalReportGroups error:', error);
        throw error;
    }
};
//# sourceMappingURL=medicalReport.service.js.map