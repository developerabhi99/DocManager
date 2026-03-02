import type { Request, Response } from "express";
import { prisma } from "../config/db.js";

// Create transaction (appointment fee)
export async function createTransaction(req: Request, res: Response) {
  const { patientId, appointmentId, amount, paymentMethod, description } = req.body;
  const authUser: any = (req as any).user;

  try {
    // Validate payment method
    const validMethods = ['CASH', 'CARD', 'ONLINE', 'INSURANCE'];
    if (!validMethods.includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    const transaction = await prisma.transaction.create({
      data: {
        patientId,
        appointmentId,
        amount,
        paymentMethod,
        description: description || 'Appointment fee',
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

    res.json(transaction);
  } catch (error) {
    console.error("createTransaction error:", error);
    res.status(500).json({ error: "Failed to create transaction" });
  }
}

// Update transaction status (mark as paid)
export async function updateTransactionStatus(req: Request, res: Response) {
  const { transactionId } = req.params;
  const { status } = req.body;

  try {
    const validStatuses = ['PENDING', 'PAID', 'REFUNDED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const transaction = await prisma.transaction.update({
      where: { id: transactionId as string },
      data: { status },
      include: {
        patient: true,
        appointment: {
          include: {
            doctor: true
          }
        }
      }
    });

    res.json(transaction);
  } catch (error) {
    console.error("updateTransactionStatus error:", error);
    res.status(500).json({ error: "Failed to update transaction" });
  }
}

// Get patient transactions
export async function getPatientTransactions(req: Request, res: Response) {
  const { patientId } = req.params;

  try {
    const transactions = await prisma.transaction.findMany({
      where: { patientId: patientId as string },
      include: {
        appointment: {
          include: {
            doctor: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(transactions);
  } catch (error) {
    console.error("getPatientTransactions error:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
}

// Get all transactions (admin)
export async function getAllTransactions(req: Request, res: Response) {
  const authUser: any = (req as any).user;

  try {
    // Only admin can view all transactions
    if (authUser.role !== "SUPER_ADMIN") {
      return res.status(403).json({ message: "Access denied" });
    }

    const transactions = await prisma.transaction.findMany({
      include: {
        patient: true,
        appointment: {
          include: {
            doctor: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(transactions);
  } catch (error) {
    console.error("getAllTransactions error:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
}
