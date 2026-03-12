import type { Request, Response } from 'express';
import { prisma } from '../index.js';

export async function getPatientCompleteHistory(req: Request, res: Response) {
  const { patientId } = req.params;
  const authUser: any = (req as any).user;

  try {
    if (!patientId) {
      return res.status(400).json({ error: 'Patient ID is required' });
    }

    // Handle array case for patientId
    const patientIdStr: string = Array.isArray(patientId) ? patientId[0]! : patientId!;

    // Fetch patient's complete visit history with medical reports
    const patientHistory = await prisma.appointment.findMany({
      where: { 
        patientId: patientIdStr,
        status: { in: ["COMPLETED", "REFERRED", "SCHEDULED"] }
      },
      include: {
        patient: true,
        doctor: {
          include: {
            department: true
          }
        },
        reports: {
          include: {
            doctor: true,
            medicalReportGroup: true
          }
        },
        transactions: {
          where: { status: "PAID" },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: [
        { visitNumber: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    if (!patientHistory || patientHistory.length === 0) {
      return res.json({ 
        patient: null,
        treatmentGroups: [],
        totalVisits: 0,
        message: 'No visit history found for this patient'
      });
    }

    // Group visits by medical report groups (treatment episodes)
    const treatmentGroups = patientHistory.reduce((groups, appointment: any) => {
      const reportGroupId = appointment.reports && appointment.reports.length > 0 
        ? appointment.reports[0]?.medicalReportGroupId || 'ungrouped' 
        : 'ungrouped';
      
      if (!groups[reportGroupId]) {
        groups[reportGroupId] = {
          id: reportGroupId,
          title: (appointment.reports && appointment.reports.length > 0) 
            ? appointment.reports[0]?.medicalReportGroup?.title || 'General Treatment' 
            : 'General Treatment',
          description: (appointment.reports && appointment.reports.length > 0) 
            ? appointment.reports[0]?.medicalReportGroup?.description 
            : undefined,
          status: (appointment.reports && appointment.reports.length > 0) 
            ? appointment.reports[0]?.medicalReportGroup?.status || 'ACTIVE' 
            : 'ACTIVE',
          startDate: appointment.dateTime,
          endDate: appointment.dateTime,
          visits: []
        };
      }
      
      groups[reportGroupId].visits.push({
        id: appointment.id,
        visitNumber: appointment.visitNumber,
        dateTime: appointment.dateTime,
        status: appointment.status,
        doctor: appointment.doctor,
        notes: appointment.notes,
        referredTo: appointment.referredTo,
        referredFrom: appointment.referredFrom,
        medicalReport: (appointment.reports && appointment.reports.length > 0) ? appointment.reports[0] : null,
        payment: (appointment.transactions && appointment.transactions.length > 0) ? appointment.transactions[0] : null
      });
      
      // Update end date if this visit is later
      if (appointment.dateTime > groups[reportGroupId].endDate) {
        groups[reportGroupId].endDate = appointment.dateTime;
      }
      
      return groups;
    }, {} as any);

    const patientInfo = (patientHistory[0] as any)?.patient;

    res.json({
      patient: patientInfo,
      treatmentGroups: Object.values(treatmentGroups),
      totalVisits: patientHistory.length,
      lastVisit: patientHistory[patientHistory.length - 1]?.dateTime
    });
  } catch (error) {
    console.error('getPatientCompleteHistory error:', error);
    res.status(500).json({ error: 'Failed to fetch patient history' });
  }
}
