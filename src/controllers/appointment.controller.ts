import type { Request, Response } from 'express';
import { prisma } from '../config/db.js';

export const createPatient = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, address, age, gender } = req.body;
    const patient = await prisma.patient.create({
      data: { name, email, phone, address, age, gender },
    });
    res.json(patient);
  } catch (error) {
    console.error('createPatient error:', error);
    res.status(500).json({ error: 'Failed to create patient' });
  }
};

export const listPatients = async (req: Request, res: Response) => {
  try {
    const patients = await prisma.patient.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(patients);
  } catch (error) {
    console.error('listPatients error:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
};

export const createAppointment = async (req: Request, res: Response) => {
  try {
    const { patientId, doctorId, dateTime, notes } = req.body;
    const appointment = await prisma.appointment.create({
      data: { patientId, doctorId, dateTime: new Date(dateTime), notes },
      include: { patient: true, doctor: { select: { id: true, name: true, email: true } } },
    });
    res.json(appointment);
  } catch (error) {
    console.error('createAppointment error:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
};

export const listAppointments = async (req: Request, res: Response) => {
  try {
    const appointments = await prisma.appointment.findMany({
      orderBy: { dateTime: 'desc' },
      include: {
        patient: true,
        doctor: { select: { id: true, name: true, email: true } },
      },
    });
    res.json(appointments);
  } catch (error) {
    console.error('listAppointments error:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};
