import { prisma } from "../config/db.js";
// Get employee's schedules
export async function getEmployeeSchedules(req, res) {
    const { userId } = req.params;
    const authUser = req.user;
    try {
        // Users can only view their own schedules unless they're admin
        if (authUser.userId !== userId && authUser.role !== "SUPER_ADMIN" && !authUser.permissions?.includes("MANAGE_SCHEDULE")) {
            return res.status(403).json({ message: "Access denied" });
        }
        const schedules = await prisma.employeeSchedule.findMany({
            where: { userId: userId },
            orderBy: [
                { dayOfWeek: "asc" },
                { startTime: "asc" }
            ]
        });
        res.json(schedules);
    }
    catch (error) {
        console.error("getEmployeeSchedules error:", error);
        res.status(500).json({ error: "Failed to fetch schedules" });
    }
}
// Create/update employee schedule
export async function upsertEmployeeSchedule(req, res) {
    const { userId } = req.params;
    const { dayOfWeek, startTime, endTime, isAvailable } = req.body;
    const authUser = req.user;
    try {
        // Users can only manage their own schedules unless they're admin
        if (authUser.userId !== userId && authUser.role !== "SUPER_ADMIN" && !authUser.permissions?.includes("MANAGE_SCHEDULE")) {
            return res.status(403).json({ message: "Access denied" });
        }
        // Validate time format
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
            return res.status(400).json({ message: "Invalid time format. Use HH:MM" });
        }
        // Convert dayOfWeek to number if it's a string
        const dayOfWeekNum = typeof dayOfWeek === 'string' ? parseInt(dayOfWeek, 10) : dayOfWeek;
        // Validate day of week
        if (dayOfWeekNum < 0 || dayOfWeekNum > 6) {
            return res.status(400).json({ message: "Invalid day of week. Must be 0-6" });
        }
        // Check if start time is before end time
        const start = new Date(`2000-01-01T${startTime}`);
        const end = new Date(`2000-01-01T${endTime}`);
        if (start >= end) {
            return res.status(400).json({ message: "Start time must be before end time" });
        }
        const schedule = await prisma.employeeSchedule.upsert({
            where: {
                userId_dayOfWeek_startTime: {
                    userId: userId,
                    dayOfWeek: dayOfWeekNum,
                    startTime
                }
            },
            update: {
                endTime,
                isAvailable
            },
            create: {
                userId: userId,
                dayOfWeek: dayOfWeekNum,
                startTime,
                endTime,
                isAvailable
            }
        });
        res.json(schedule);
    }
    catch (error) {
        console.error("upsertEmployeeSchedule error:", error);
        res.status(500).json({ error: "Failed to save schedule" });
    }
}
// Delete employee schedule
export async function deleteEmployeeSchedule(req, res) {
    const { userId, scheduleId } = req.params;
    const authUser = req.user;
    try {
        // Users can only delete their own schedules unless they're admin
        if (authUser.userId !== userId && authUser.role !== "SUPER_ADMIN" && !authUser.permissions?.includes("MANAGE_SCHEDULE")) {
            return res.status(403).json({ message: "Access denied" });
        }
        const schedule = await prisma.employeeSchedule.findFirst({
            where: {
                id: scheduleId,
                userId: userId
            }
        });
        if (!schedule) {
            return res.status(404).json({ message: "Schedule not found" });
        }
        await prisma.employeeSchedule.delete({
            where: { id: scheduleId }
        });
        res.json({ message: "Schedule deleted successfully" });
    }
    catch (error) {
        console.error("deleteEmployeeSchedule error:", error);
        res.status(500).json({ error: "Failed to delete schedule" });
    }
}
// Get all employees with their schedules (for admin/super admin)
export async function getAllEmployeeSchedules(req, res) {
    const authUser = req.user;
    try {
        // Only admin or super admin can view all schedules
        if (authUser.role !== "SUPER_ADMIN" && authUser.role?.permissions !== "MANAGE_SCHEDULE") {
            return res.status(403).json({ message: "Access denied" });
        }
        const employees = await prisma.user.findMany({
            where: {
                isActive: true,
            },
            include: {
                employeeSchedules: {
                    orderBy: [
                        { dayOfWeek: "asc" },
                        { startTime: "asc" }
                    ]
                },
                role: {
                    select: { name: true }
                }
            }
        });
        res.json(employees);
    }
    catch (error) {
        console.error("getAllEmployeeSchedules error:", error);
        res.status(500).json({ error: "Failed to fetch employee schedules" });
    }
}
// Create default working hours for new employees
export async function createDefaultSchedule(req, res) {
    const { userId } = req.params;
    const authUser = req.user;
    try {
        // Only admin or super admin can create default schedules
        if (authUser.role !== "SUPER_ADMIN" && authUser.role?.permissions !== "MANAGE_SCHEDULE") {
            return res.status(403).json({ message: "Access denied" });
        }
        // Default working hours: Monday-Friday, 9:00 AM - 5:00 PM
        const defaultSchedules = [];
        for (let dayOfWeek = 1; dayOfWeek <= 5; dayOfWeek++) { // Monday (1) to Friday (5)
            defaultSchedules.push({
                userId: userId,
                dayOfWeek,
                startTime: "09:00",
                endTime: "17:00",
                isAvailable: true
            });
        }
        // Create all default schedules
        const schedules = await prisma.employeeSchedule.createMany({
            data: defaultSchedules,
            skipDuplicates: true
        });
        res.json({
            message: "Default schedule created successfully",
            schedulesCreated: schedules.count
        });
    }
    catch (error) {
        console.error("createDefaultSchedule error:", error);
        res.status(500).json({ error: "Failed to create default schedule" });
    }
}
// Create default schedules for all users without schedules
export async function createDefaultSchedulesForAll(req, res) {
    const authUser = req.user;
    try {
        // Only super admin can create default schedules for all
        if (authUser.role !== "SUPER_ADMIN" && authUser.role?.permissions !== "MANAGE_SCHEDULE") {
            return res.status(403).json({ message: "Access denied" });
        }
        // Get all active users without employee schedules
        const usersWithoutSchedules = await prisma.user.findMany({
            where: {
                isActive: true,
                employeeSchedules: {
                    none: {}
                }
            },
            select: {
                id: true
            }
        });
        let totalCreated = 0;
        // Create default schedules for each user
        for (const user of usersWithoutSchedules) {
            const defaultSchedules = [];
            for (let dayOfWeek = 1; dayOfWeek <= 5; dayOfWeek++) { // Monday to Friday
                defaultSchedules.push({
                    userId: user.id,
                    dayOfWeek,
                    startTime: "09:00",
                    endTime: "17:00",
                    isAvailable: true
                });
            }
            const result = await prisma.employeeSchedule.createMany({
                data: defaultSchedules,
                skipDuplicates: true
            });
            totalCreated += result.count;
        }
        res.json({
            message: "Default schedules created successfully",
            usersProcessed: usersWithoutSchedules.length,
            totalSchedulesCreated: totalCreated
        });
    }
    catch (error) {
        console.error("createDefaultSchedulesForAll error:", error);
        res.status(500).json({ error: "Failed to create default schedules" });
    }
}
//# sourceMappingURL=employeeSchedule.controller.js.map