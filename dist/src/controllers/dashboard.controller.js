import { prisma } from '../config/db.js';
// Get general dashboard statistics (available to all authenticated users)
export const getDashboardStats = async (req, res) => {
    try {
        // Get current month for financial calculations
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const monthStart = new Date(currentYear, currentMonth, 1);
        const monthEnd = new Date(currentYear, currentMonth + 1, 0);
        // Count total appointments
        const totalAppointments = await prisma.appointment.count({
            where: {
                createdAt: {
                    gte: monthStart,
                    lt: monthEnd
                }
            }
        });
        // Count completed appointments
        const completedAppointments = await prisma.appointment.count({
            where: {
                status: 'COMPLETED',
                createdAt: {
                    gte: monthStart,
                    lt: monthEnd
                }
            }
        });
        // Count total patients
        const totalPatients = await prisma.patient.count();
        // Count total users
        const totalUsers = await prisma.user.count({
            where: {
                isActive: true
            }
        });
        // Count total departments
        const totalDepartments = await prisma.department.count({
            where: {
                isActive: true
            }
        });
        // Count total medical reports
        const totalReports = await prisma.medicalReport.count();
        // Count referral appointments
        const referralAppointments = await prisma.appointment.count({
            where: {
                status: 'REFERRED',
                createdAt: {
                    gte: monthStart,
                    lt: monthEnd
                }
            }
        });
        // Calculate financial totals
        const transactions = await prisma.transaction.findMany({
            where: {
                createdAt: {
                    gte: monthStart,
                    lt: monthEnd
                },
                status: 'PAID'
            }
        });
        const totalEarnings = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
        const totalSpend = Math.abs(totalEarnings * 0.1); // Example calculation
        // Get task statistics (example: count completed appointments as tasks)
        const newTasks = completedAppointments * 0.5; // Example calculation
        const totalProjects = totalReports; // Example: each report group is a project
        const stats = {
            earnings: totalEarnings,
            spendThisMonth: totalSpend,
            sales: totalEarnings * 1.2, // Example calculation
            balance: totalEarnings - totalSpend,
            newTasks: Math.round(newTasks),
            totalProjects: Math.round(totalProjects),
            // Permission-specific data
            totalUsers,
            totalDepartments,
            totalAppointments,
            totalReferrals: referralAppointments,
            totalReports,
            totalPatients
        };
        res.json(stats);
    }
    catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
};
// Get user management statistics (requires MANAGE_USERS permission)
export const getUsersCount = async (req, res) => {
    try {
        const totalUsers = await prisma.user.count({
            where: {
                isActive: true
            }
        });
        const totalDepartments = await prisma.department.count({
            where: {
                isActive: true
            }
        });
        // Get user distribution by role using raw query to avoid Prisma limitations
        const usersByRole = await prisma.$queryRaw `
      SELECT 
        r.name as "roleName",
        COUNT(u.id) as "count"
      FROM "User" u
      JOIN "Role" r ON u."roleId" = r.id
      WHERE u."isActive" = true
      GROUP BY r.name
    `;
        res.json({
            count: totalUsers,
            departments: totalDepartments,
            usersByRole: usersByRole.map((role) => ({
                roleName: role.roleName,
                count: Number(role.count)
            }))
        });
    }
    catch (error) {
        console.error('Error fetching user count:', error);
        res.status(500).json({ error: 'Failed to fetch user statistics' });
    }
};
// Get appointment statistics (requires MANAGE_APPOINTMENTS permission)
export const getAppointmentsCount = async (req, res) => {
    try {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const monthStart = new Date(currentYear, currentMonth, 1);
        const monthEnd = new Date(currentYear, currentMonth + 1, 0);
        // Total appointments this month
        const totalAppointments = await prisma.appointment.count({
            where: {
                createdAt: {
                    gte: monthStart,
                    lt: monthEnd
                }
            }
        });
        // Completed appointments this month
        const completedAppointments = await prisma.appointment.count({
            where: {
                status: 'COMPLETED',
                createdAt: {
                    gte: monthStart,
                    lt: monthEnd
                }
            }
        });
        // Referral appointments this month
        const referralAppointments = await prisma.appointment.count({
            where: {
                status: 'REFERRED',
                createdAt: {
                    gte: monthStart,
                    lt: monthEnd
                }
            }
        });
        // Get appointments by status using raw query
        const appointmentsByStatus = await prisma.$queryRaw `
      SELECT 
        status,
        COUNT(id) as "count"
      FROM "Appointment"
      WHERE "createdAt" >= ${monthStart} AND "createdAt" < ${monthEnd}
      GROUP BY status
    `;
        res.json({
            total: totalAppointments,
            completed: completedAppointments,
            referrals: referralAppointments,
            byStatus: appointmentsByStatus.map((status) => ({
                status: status.status,
                count: Number(status.count)
            }))
        });
    }
    catch (error) {
        console.error('Error fetching appointment count:', error);
        res.status(500).json({ error: 'Failed to fetch appointment statistics' });
    }
};
// Get report statistics (requires VIEW_REPORTS permission)
export const getReportsCount = async (req, res) => {
    try {
        const totalReports = await prisma.medicalReport.count();
        const totalPatients = await prisma.patient.count();
        // Get reports by month using raw query
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        const reportsByMonth = await prisma.$queryRaw `
      SELECT 
        DATE_TRUNC('month', "createdAt") as month,
        COUNT(id) as "count"
      FROM "MedicalReport"
      WHERE "createdAt" >= ${sixMonthsAgo}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month ASC
    `;
        // Group by month for chart data
        const monthlyData = reportsByMonth.map((group) => {
            const month = new Date(group.month).toLocaleDateString('en-US', { month: 'short' });
            return {
                month,
                count: Number(group.count)
            };
        });
        res.json({
            count: totalReports,
            patients: totalPatients,
            monthlyData
        });
    }
    catch (error) {
        console.error('Error fetching report count:', error);
        res.status(500).json({ error: 'Failed to fetch report statistics' });
    }
};
//# sourceMappingURL=dashboard.controller.js.map