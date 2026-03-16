import type { Request, Response } from "express";
import { prisma } from "../config/db.js";

// Get current user's appointments (for both doctors and patients)
// Super admins can see all appointments with optional filtering
export async function getMyAppointments(req: Request, res: Response) {
  const authUser: any = (req as any).user;
  const { doctorId, patientId } = req.query;
      console.log("authUser", authUser);

  try {
    let appointments;
    let whereClause: any = {};

    if (authUser.role === "SUPER_ADMIN") {
      // Super admin can filter by doctor and/or patient
      if (doctorId) {
        whereClause.doctorId = doctorId as string;
      }
      if (patientId) {
        whereClause.patientId = patientId as string;
      }
      
      appointments = await prisma.appointment.findMany({
        where: whereClause,
        include: {
          patient: true,
          doctor: true,
          transactions: true,
          reports: true
        },
        orderBy: { dateTime: 'desc' }
      });
    } else if (authUser.role === "Doctor") {
      // Doctor sees their appointments (can filter by patient)
      whereClause.doctorId = authUser.userId;
      console.log("whereClause", authUser);
      if (patientId) {
        whereClause.patientId = patientId as string;
      }
       
      appointments = await prisma.appointment.findMany({
        where: whereClause,
        include: {
          patient: true,
          transactions: true,
          reports: true
        },
        orderBy: { dateTime: 'desc' }
      });
    } else {
      // Other than main Doctor sees their appointments only
      whereClause.doctorId = authUser.userId;
      
      appointments = await prisma.appointment.findMany({
        where: whereClause,
        include: {
          doctor: true,
          transactions: true,
          reports: true
        },
        orderBy: { dateTime: 'desc' }
      });
    }

    console.log("appointments", appointments);

    res.json(appointments);

  } catch (error) {
    console.error("getMyAppointments error:", error);
    res.status(500).json({ error: "Failed to fetch appointments" });
  }
}

// Get appointment details with full information
export async function getAppointmentDetails(req: Request, res: Response) {
  const { appointmentId } = req.params;
  const authUser: any = (req as any).user;

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId as string },
      include: {
        patient: true,
        doctor: true,
        transactions: true,
        reports: true
      }
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Check if user has access to this appointment
    if (authUser.userId !== appointment.patientId && authUser.userId !== appointment.doctorId && authUser.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(appointment);
  } catch (error) {
    console.error("getAppointmentDetails error:", error);
    res.status(500).json({ error: "Failed to fetch appointment details" });
  }
}

// Complete appointment and create transaction
export async function completeAppointment(req: Request, res: Response) {
  const { appointmentId, amount, paymentMethod, paymentDescription } = req.body;
  const authUser: any = (req as any).user;

  try {
    // Get appointment details
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
        doctor: true
      }
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Only the assigned doctor can complete the appointment
    if (appointment.doctorId !== authUser.userId) {
      return res.status(403).json({ message: "Only the assigned doctor can complete this appointment" });
    }

    // Update appointment status
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'COMPLETED' },
      include: {
        patient: true,
        doctor: true
      }
    });

    // Create transaction for appointment fee
    const transaction = await prisma.transaction.create({
      data: {
        patientId: appointment.patientId,
        appointmentId: appointmentId,
        amount: amount || 100, // Default fee
        paymentMethod: paymentMethod || 'CASH',
        description: paymentDescription || `Appointment fee - Visit #${appointment.visitNumber}`,
        status: 'PENDING'
      },
      include: {
        patient: true,
        appointment: {
          include: {
            doctor: true
          }
        }
      }
    });

    res.json({
      appointment: updatedAppointment,
      transaction
    });
  } catch (error) {
    console.error("completeAppointment error:", error);
    res.status(500).json({ error: "Failed to complete appointment" });
  }
}

// Get patient's appointment history
export async function getPatientHistory(req: Request, res: Response) {
  const { patientId } = req.params;
  const authUser: any = (req as any).user;

  try {
    // Check if user has access to patient history
    if (authUser.userId !== patientId && authUser.role !== "SUPER_ADMIN" && authUser.role !== "Doctor") {
      return res.status(403).json({ message: "Access denied" });
    }

    const appointments = await prisma.appointment.findMany({
      where: { patientId: patientId as string },
      include: {
        doctor: true,
        transactions: true,
        reports: true
      },
      orderBy: { dateTime: 'desc' }
    });

    // Calculate summary statistics
    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(apt => apt.status === 'COMPLETED').length;
    const totalSpent = appointments.reduce((sum: number, apt: any) => {
      return sum + apt.transactions.reduce((transactionSum: number, trans: any) => {
        return transactionSum + (trans.status === 'PAID' ? trans.amount : 0);
      }, 0);
    }, 0);
    const pendingPayments = appointments.reduce((sum: number, apt: any) => {
      return sum + apt.transactions.reduce((transactionSum: number, trans: any) => {
        return transactionSum + (trans.status === 'PENDING' ? trans.amount : 0);
      }, 0);
    }, 0);

    res.json({
      summary: {
        totalAppointments,
        completedAppointments,
        totalSpent,
        pendingPayments
      },
      appointments
    });
  } catch (error) {
    console.error("getPatientHistory error:", error);
    res.status(500).json({ error: "Failed to fetch patient history" });
  }
}

// Get doctors and patients for dropdown filters (super admin only)
export async function getDoctorsAndPatients(req: Request, res: Response) {
  const authUser: any = (req as any).user;

  try {
    // Only super admin can access this endpoint
    if (authUser.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Access denied" });
    }

    // Get all doctors
    const doctors = await prisma.user.findMany({
      where: {
        isActive: true,
        role: {
          name: { contains: "DOCTOR", mode: "insensitive" }
        }
      },
      select: {
        id: true,
        name: true,
        email: true
      },
      orderBy: { name: 'asc' }
    });

    // Get all patients
    const patients = await prisma.patient.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      doctors,
      patients
    });
  } catch (error) {
    console.error("getDoctorsAndPatients error:", error);
    res.status(500).json({ error: "Failed to fetch doctors and patients" });
  }
}

// Get doctor's appointment schedule
// Super admins can see all doctor schedules
export async function getDoctorSchedule(req: Request, res: Response) {
  const authUser: any = (req as any).user;

  try {
    if (authUser.role !== "Doctor" && authUser.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Access denied" });
    }

    let appointments;
    
    if (authUser.role === "SUPER_ADMIN") {
      // Super admin sees all doctor appointments
      appointments = await prisma.appointment.findMany({
        include: {
          patient: true,
          doctor: true,
          transactions: true,
          reports: true
        },
        orderBy: { dateTime: 'asc' }
      });
    } else {
      // Doctor sees only their appointments
      appointments = await prisma.appointment.findMany({
        where: { doctorId: authUser.userId },
        include: {
          patient: true,
          transactions: true,
          reports: true
        },
        orderBy: { dateTime: 'asc' }
      });
    }

    // Group appointments by status
    const scheduled = appointments.filter(apt => apt.status === 'SCHEDULED');
    const completed = appointments.filter(apt => apt.status === 'COMPLETED');
    const cancelled = appointments.filter(apt => apt.status === 'CANCELLED');
    const referred = appointments.filter(apt => apt.status === 'REFERRED');

    // Calculate today's earnings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayEarnings = appointments
      .filter(apt => apt.dateTime >= today && apt.dateTime < tomorrow)
      .reduce((sum: number, apt: any) => {
        return sum + apt.transactions.reduce((transactionSum: number, trans: any) => {
          return transactionSum + (trans.status === 'PAID' ? trans.amount : 0);
        }, 0);
      }, 0);

    res.json({
      summary: {
        total: appointments.length,
        scheduled: scheduled.length,
        completed: completed.length,
        cancelled: cancelled.length,
        referred: referred.length,
        todayEarnings
      },
      appointments
    });
  } catch (error) {
    console.error("getDoctorSchedule error:", error);
    res.status(500).json({ error: "Failed to fetch doctor schedule" });
  }
}
