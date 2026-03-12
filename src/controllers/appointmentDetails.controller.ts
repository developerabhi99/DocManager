import type { Request, Response } from 'express';
import { prisma } from '../index.js';

export async function getComprehensiveAppointmentDetails(req: Request, res: Response) {
  const { id } = req.params;
  const authUser: any = (req as any).user;

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
      referredToDoctor,
      referredFromAppointment,
      medicalReport: appointment.reports && appointment.reports.length > 0 ? appointment.reports[0] : null
    };

    res.json(response);
  } catch (error) {
    console.error('getComprehensiveAppointmentDetails error:', error);
    res.status(500).json({ error: 'Failed to fetch appointment details' });
  }
}
