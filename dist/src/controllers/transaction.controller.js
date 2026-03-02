import { prisma } from "../config/db.js";
// Create transaction (appointment fee)
export async function createTransaction(req, res) {
    const { patientId, appointmentId, amount, paymentMethod, description } = req.body;
    const authUser = req.user;
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
        // Check if transaction already exists for this appointment
        if (appointmentId) {
            const existingTransaction = await prisma.transaction.findFirst({
                where: { appointmentId }
            });
            if (existingTransaction) {
                return res.status(400).json({
                    message: "Transaction already exists for this appointment"
                });
            }
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
    }
    catch (error) {
        console.error("createTransaction error:", error);
        res.status(500).json({ error: "Failed to create transaction" });
    }
}
// Update transaction status (mark as paid)
export async function updateTransactionStatus(req, res) {
    const { transactionId } = req.params;
    const { status, notes } = req.body;
    const authUser = req.user;
    try {
        const validStatuses = ['PENDING', 'PAID', 'REFUNDED', 'CANCELLED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }
        // Get existing transaction
        const existingTransaction = await prisma.transaction.findUnique({
            where: { id: transactionId }
        });
        if (!existingTransaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }
        // Log status change for audit trail
        const statusChangeData = { status };
        // Add notes if provided
        if (notes) {
            statusChangeData.description = existingTransaction.description
                ? `${existingTransaction.description} - ${notes}`
                : notes;
        }
        // Add processed by user info
        if (authUser) {
            statusChangeData.processedBy = authUser.id;
            statusChangeData.processedAt = new Date();
        }
        const transaction = await prisma.transaction.update({
            where: { id: transactionId },
            data: statusChangeData,
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
    }
    catch (error) {
        console.error("updateTransactionStatus error:", error);
        res.status(500).json({ error: "Failed to update transaction" });
    }
}
// Get patient transactions
export async function getPatientTransactions(req, res) {
    const { patientId } = req.params;
    const { page = 1, limit = 10, status, startDate, endDate } = req.query;
    try {
        const where = { patientId: patientId };
        // Filter by status if provided
        if (status) {
            where.status = status;
        }
        // Filter by date range if provided
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                where.createdAt.lte = new Date(endDate);
            }
        }
        const skip = (Number(page) - 1) * Number(limit);
        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                where,
                include: {
                    appointment: {
                        include: {
                            doctor: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: Number(limit)
            }),
            prisma.transaction.count({ where })
        ]);
        res.json({
            transactions,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        console.error("getPatientTransactions error:", error);
        res.status(500).json({ error: "Failed to fetch transactions" });
    }
}
// Get all transactions (admin)
export async function getAllTransactions(req, res) {
    const authUser = req.user;
    const { page = 1, limit = 10, status, startDate, endDate, patientId, paymentMethod } = req.query;
    try {
        // Only admin can view all transactions
        if (authUser.role !== "SUPER_ADMIN") {
            return res.status(403).json({ message: "Access denied" });
        }
        const where = {};
        // Filter by status if provided
        if (status) {
            where.status = status;
        }
        // Filter by patient if provided
        if (patientId) {
            where.patientId = patientId;
        }
        // Filter by payment method if provided
        if (paymentMethod) {
            where.paymentMethod = paymentMethod;
        }
        // Filter by date range if provided
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                where.createdAt.lte = new Date(endDate);
            }
        }
        const skip = (Number(page) - 1) * Number(limit);
        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                where,
                include: {
                    patient: true,
                    appointment: {
                        include: {
                            doctor: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: Number(limit)
            }),
            prisma.transaction.count({ where })
        ]);
        res.json({
            transactions,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        console.error("getAllTransactions error:", error);
        res.status(500).json({ error: "Failed to fetch transactions" });
    }
}
// Get transaction statistics
export async function getTransactionStats(req, res) {
    const authUser = req.user;
    const { startDate, endDate } = req.query;
    try {
        // Only admin can view statistics
        if (authUser.role !== "SUPER_ADMIN") {
            return res.status(403).json({ message: "Access denied" });
        }
        const where = {};
        // Filter by date range if provided
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                where.createdAt.lte = new Date(endDate);
            }
        }
        const [totalTransactions, totalRevenue, statusBreakdown, paymentMethodBreakdown] = await Promise.all([
            prisma.transaction.count({ where }),
            prisma.transaction.aggregate({
                where: { ...where, status: 'PAID' },
                _sum: { amount: true }
            }),
            prisma.transaction.groupBy({
                by: ['status'],
                where,
                _count: { status: true },
                _sum: { amount: true }
            }),
            prisma.transaction.groupBy({
                by: ['paymentMethod'],
                where: { ...where, status: 'PAID' },
                _count: { paymentMethod: true },
                _sum: { amount: true }
            })
        ]);
        res.json({
            summary: {
                totalTransactions,
                totalRevenue: totalRevenue._sum.amount || 0,
                averageTransactionValue: totalTransactions > 0 ? (totalRevenue._sum.amount || 0) / totalTransactions : 0
            },
            statusBreakdown,
            paymentMethodBreakdown
        });
    }
    catch (error) {
        console.error("getTransactionStats error:", error);
        res.status(500).json({ error: "Failed to fetch transaction statistics" });
    }
}
// Refund transaction
export async function refundTransaction(req, res) {
    const { transactionId } = req.params;
    const { reason, amount } = req.body;
    const authUser = req.user;
    try {
        // Only admin can process refunds
        if (authUser.role !== "SUPER_ADMIN") {
            return res.status(403).json({ message: "Access denied" });
        }
        const existingTransaction = await prisma.transaction.findUnique({
            where: { id: transactionId }
        });
        if (!existingTransaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }
        if (existingTransaction.status !== 'PAID') {
            return res.status(400).json({
                message: "Only paid transactions can be refunded"
            });
        }
        // Validate refund amount
        const refundAmount = amount || existingTransaction.amount;
        if (refundAmount > existingTransaction.amount) {
            return res.status(400).json({
                message: "Refund amount cannot exceed original transaction amount"
            });
        }
        // Update original transaction
        const updatedTransaction = await prisma.transaction.update({
            where: { id: transactionId },
            data: {
                status: 'REFUNDED',
                description: existingTransaction.description
                    ? `${existingTransaction.description} - REFUNDED: ${reason}`
                    : `REFUNDED: ${reason}`
            }
        });
        // Create refund transaction record
        const refundTransaction = await prisma.transaction.create({
            data: {
                patientId: existingTransaction.patientId,
                appointmentId: existingTransaction.appointmentId,
                amount: -refundAmount, // Negative amount for refund
                paymentMethod: existingTransaction.paymentMethod,
                description: `Refund for transaction ${transactionId}: ${reason}`,
                status: 'PAID'
            }
        });
        res.json({
            originalTransaction: updatedTransaction,
            refundTransaction,
            message: "Transaction refunded successfully"
        });
    }
    catch (error) {
        console.error("refundTransaction error:", error);
        res.status(500).json({ error: "Failed to refund transaction" });
    }
}
//# sourceMappingURL=transaction.controller.js.map