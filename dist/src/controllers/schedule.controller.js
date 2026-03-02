import { prisma } from "../config/db.js";
// Get doctor's schedules
export async function getDoctorSchedules(req, res) {
    const { doctorId } = req.params;
    const authUser = req.user;
    try {
        // Users can only view their own schedules unless they're admin
        if (authUser.userId !== doctorId && authUser.role !== "SUPER_ADMIN") {
            return res.status(403).json({ message: "Access denied" });
        }
        const schedules = await prisma.doctorSchedule.findMany({
            where: { doctorId: doctorId },
            orderBy: [
                { dayOfWeek: "asc" },
                { startTime: "asc" }
            ]
        });
        res.json(schedules);
    }
    catch (error) {
        console.error("getDoctorSchedules error:", error);
        res.status(500).json({ error: "Failed to fetch schedules" });
    }
}
// Create/update doctor schedule
export async function upsertDoctorSchedule(req, res) {
    const { doctorId } = req.params;
    const { dayOfWeek, startTime, endTime, isAvailable } = req.body;
    const authUser = req.user;
    try {
        // Users can only manage their own schedules unless they're admin
        if (authUser.userId !== doctorId && authUser.role !== "SUPER_ADMIN") {
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
        const schedule = await prisma.doctorSchedule.upsert({
            where: {
                doctorId_dayOfWeek_startTime: {
                    doctorId: doctorId,
                    dayOfWeek: dayOfWeekNum,
                    startTime
                }
            },
            update: {
                endTime,
                isAvailable
            },
            create: {
                doctorId: doctorId,
                dayOfWeek: dayOfWeekNum,
                startTime,
                endTime,
                isAvailable
            }
        });
        res.json(schedule);
    }
    catch (error) {
        console.error("upsertDoctorSchedule error:", error);
        res.status(500).json({ error: "Failed to save schedule" });
    }
}
// Delete doctor schedule
export async function deleteDoctorSchedule(req, res) {
    const { doctorId, scheduleId } = req.params;
    const authUser = req.user;
    try {
        // Users can only delete their own schedules unless they're admin
        if (authUser.userId !== doctorId && authUser.role !== "SUPER_ADMIN") {
            return res.status(403).json({ message: "Access denied" });
        }
        const schedule = await prisma.doctorSchedule.findFirst({
            where: {
                id: scheduleId,
                doctorId: doctorId
            }
        });
        if (!schedule) {
            return res.status(404).json({ message: "Schedule not found" });
        }
        await prisma.doctorSchedule.delete({
            where: { id: scheduleId }
        });
        res.json({ message: "Schedule deleted successfully" });
    }
    catch (error) {
        console.error("deleteDoctorSchedule error:", error);
        res.status(500).json({ error: "Failed to delete schedule" });
    }
}
// Get doctor availability for a specific date
export async function getDoctorAvailability(req, res) {
    const { doctorId } = req.params;
    const { date } = req.query;
    try {
        if (!date || typeof date !== "string") {
            return res.status(400).json({ message: "Date parameter is required" });
        }
        const targetDate = new Date(date);
        const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, ...
        // Get doctor's schedule for this day
        const schedules = await prisma.doctorSchedule.findMany({
            where: {
                doctorId: doctorId,
                dayOfWeek,
                isAvailable: true
            },
            orderBy: { startTime: "asc" }
        });
        // Get existing appointments for this date
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);
        const appointments = await prisma.appointment.findMany({
            where: {
                doctorId: doctorId,
                dateTime: {
                    gte: startOfDay,
                    lte: endOfDay
                },
                status: "SCHEDULED"
            },
            orderBy: { dateTime: "asc" }
        });
        // Generate available time slots (30-minute intervals)
        const availableSlots = [];
        for (const schedule of schedules) {
            const [startHour, startMin] = schedule.startTime.split(":").map(Number);
            const [endHour, endMin] = schedule.endTime.split(":").map(Number);
            let currentTime = new Date(targetDate);
            currentTime.setHours(startHour || 0, startMin || 0, 0, 0);
            const endTime = new Date(targetDate);
            endTime.setHours(endHour || 0, endMin || 0, 0);
            while (currentTime < endTime) {
                const slotEnd = new Date(currentTime);
                slotEnd.setMinutes(currentTime.getMinutes() + 30);
                // Check if this slot conflicts with existing appointments
                const hasConflict = appointments.some(apt => {
                    const aptStart = new Date(apt.dateTime);
                    const aptEnd = new Date(aptStart);
                    aptEnd.setMinutes(aptStart.getMinutes() + 30);
                    return (currentTime < aptEnd && slotEnd > aptStart);
                });
                if (!hasConflict) {
                    availableSlots.push({
                        startTime: currentTime.toISOString(),
                        endTime: slotEnd.toISOString()
                    });
                }
                currentTime.setMinutes(currentTime.getMinutes() + 30);
            }
        }
        res.json({
            date,
            dayOfWeek,
            schedules,
            appointments,
            availableSlots
        });
    }
    catch (error) {
        console.error("getDoctorAvailability error:", error);
        res.status(500).json({ error: "Failed to check availability" });
    }
}
// Get all doctors with their schedules (for admin/super admin)
export async function getAllDoctorSchedules(req, res) {
    const authUser = req.user;
    try {
        // Only admin or super admin can view all schedules
        if (authUser.role !== "SUPER_ADMIN") {
            return res.status(403).json({ message: "Access denied" });
        }
        const doctors = await prisma.user.findMany({
            where: {
                isActive: true,
                role: {
                    name: { contains: "DOCTOR", mode: "insensitive" }
                }
            },
            include: {
                schedules: {
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
        res.json(doctors);
    }
    catch (error) {
        console.error("getAllDoctorSchedules error:", error);
        res.status(500).json({ error: "Failed to fetch doctor schedules" });
    }
}
//# sourceMappingURL=schedule.controller.js.map