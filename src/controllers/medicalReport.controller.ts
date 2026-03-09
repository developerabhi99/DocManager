import type { Request, Response } from "express";
import { prisma } from "../config/db.js";

// Create medical report with file upload
export async function createMedicalReportWithFile(req: Request, res: Response) {
  const { appointmentId, diagnosis, symptoms, treatment, prescription, notes } = req.body;
  const authUser: any = (req as any).user;

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Create file URL
    const fileUrl = `/uploads/${req.file.filename}`;

    // Verify the appointment exists and belongs to the doctor
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: true,
        patient: true
      }
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    console.log("Appointment:", appointment);
    console.log("Auth user:", authUser);

    // Only the assigned doctor or Super Admin can create a report
    if (appointment.doctorId !== authUser.userId && authUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: "Only the assigned doctor can create a medical report" });
    }

    // Check if report already exists
    const existingReport = await prisma.medicalReport.findUnique({
      where: { appointmentId }
    });

    if (existingReport) {
      return res.status(400).json({ message: "Medical report already exists for this appointment" });
    }

    const report = await prisma.medicalReport.create({
      data: {
        appointmentId,
        doctorId: authUser.userId,
        diagnosis,
        symptoms,
        treatment,
        prescription,
        notes,
        reportUrl: fileUrl
      },
      include: {
        appointment: {
          include: {
            patient: true,
            doctor: true
          }
        }
      }
    });

    res.json(report);
  } catch (error) {
    console.error("createMedicalReportWithFile error:", error);
    res.status(500).json({ error: "Failed to create medical report" });
  }
}

// Create medical report after appointment completion
export async function createMedicalReport(req: Request, res: Response) {
  const { appointmentId, diagnosis, symptoms, treatment, prescription, notes, reportUrl } = req.body;
  const authUser: any = (req as any).user;

  try {
    // Verify the appointment exists and belongs to the doctor
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: true,
        patient: true
      }
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Only the assigned doctor or Super Admin can create a report
    if (appointment.doctorId !== authUser.userId && authUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: "Only the assigned doctor can create a medical report" });
    }

    // Check if report already exists
    const existingReport = await prisma.medicalReport.findUnique({
      where: { appointmentId }
    });

    if (existingReport) {
      return res.status(400).json({ message: "Medical report already exists for this appointment" });
    }

    const report = await prisma.medicalReport.create({
      data: {
        appointmentId,
        doctorId: authUser.userId,
        diagnosis,
        symptoms,
        treatment,
        prescription,
        notes,
        reportUrl
      },
      include: {
        appointment: {
          include: {
            patient: true,
            doctor: true
          }
        }
      }
    });

    res.json(report);
  } catch (error) {
    console.error("createMedicalReport error:", error);
    res.status(500).json({ error: "Failed to create medical report" });
  }
}

// Update medical report
export async function updateMedicalReport(req: Request, res: Response) {
  const { reportId } = req.params;
  const { diagnosis, symptoms, treatment, prescription, notes, reportUrl } = req.body;
  const authUser: any = (req as any).user;

  try {
    // Verify the report exists and belongs to the doctor
    const existingReport = await prisma.medicalReport.findUnique({
      where: { id: reportId as string },
      include: {
        appointment: true
      }
    });

    if (!existingReport) {
      return res.status(404).json({ message: "Medical report not found" });
    }

    // Only the assigned doctor or Super Admin can update the report
    if (existingReport.doctorId !== authUser.userId && authUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: "Only the assigned doctor can update this medical report" });
    }

    const report = await prisma.medicalReport.update({
      where: { id: reportId as string },
      data: {
        diagnosis,
        symptoms,
        treatment,
        prescription,
        notes,
        reportUrl
      },
      include: {
        appointment: {
          include: {
            patient: true,
            doctor: true
          }
        }
      }
    });

    res.json(report);
  } catch (error) {
    console.error("updateMedicalReport error:", error);
    res.status(500).json({ error: "Failed to update medical report" });
  }
}

// Get medical report by appointment ID
export async function getMedicalReportByAppointment(req: Request, res: Response) {
  const { appointmentId } = req.params;

  try {
    const report = await prisma.medicalReport.findUnique({
      where: { appointmentId: appointmentId as string },
      include: {
        appointment: {
          include: {
            patient: true,
            doctor: true
          }
        }
      }
    });

    if (!report) {
      return res.status(404).json({ message: "Medical report not found" });
    }

    res.json(report);
  } catch (error) {
    console.error("getMedicalReportByAppointment error:", error);
    res.status(500).json({ error: "Failed to fetch medical report" });
  }
}

// Get all medical reports for a patient
export async function getPatientMedicalReports(req: Request, res: Response) {
  const { patientId } = req.params;

  try {
    const reports = await prisma.medicalReport.findMany({
      where: {
        appointment: {
          patientId: patientId as string
        }
      },
      include: {
        appointment: {
          include: {
            doctor: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(reports);
  } catch (error) {
    console.error("getPatientMedicalReports error:", error);
    res.status(500).json({ error: "Failed to fetch medical reports" });
  }
}

// Refer patient to another doctor/department
export async function referPatient(req: Request, res: Response) {
  const { appointmentId, referredTo, notes } = req.body;
  const authUser: any = (req as any).user;

  try {
    // Verify the appointment exists and belongs to the doctor
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: true,
        patient: true
      }
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Only the assigned doctor or Super Admin can refer the patient
    if (appointment.doctorId !== authUser.userId && authUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: "Only the assigned doctor can refer this patient" });
    }

    // Update appointment status and referral info
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId as string },
      data: {
        status: 'REFERRED',
        referredTo,
        notes: notes ? `${appointment.notes || ''}\n\nReferral Notes: ${notes}` : appointment.notes
      },
      include: {
        patient: true,
        doctor: true
      }
    });

    // Create a new appointment for the referral
    const newAppointment = await prisma.appointment.create({
      data: {
        patientId: appointment.patientId,
        doctorId: referredTo, // This could be a doctor ID or department ID
        dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        status: 'SCHEDULED',
        visitNumber: appointment.visitNumber + 1,
        referredFrom: appointmentId,
        notes: `Referral from Dr. ${appointment.doctor.name}. ${notes || ''}`
      },
      include: {
        patient: true,
        doctor: true
      }
    });

    res.json({
      originalAppointment: updatedAppointment,
      referralAppointment: newAppointment
    });
  } catch (error) {
    console.error("referPatient error:", error);
    res.status(500).json({ error: "Failed to refer patient" });
  }
}
