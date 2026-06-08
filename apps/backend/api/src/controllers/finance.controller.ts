// ── Finance Controller ──
// SECURITY FIXES:
//   - Full Zod validation on all inputs (prevents NoSQL injection via amount/$gt)
//   - Pagination added (prevents unbounded queries)
//   - amount validated as positive number with max cap
//   - type constrained to enum (income/expense)

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppError } from '../utils/AppError';
import Transaction from '../models/Transaction';
import { z } from 'zod';

const transactionSchema = z.object({
    description: z.string().min(1, 'Description is required').max(500).trim(),
    amount: z
        .number({ invalid_type_error: 'Amount must be a number' })
        .positive('Amount must be positive')
        .max(10_000_000, 'Amount too large'),
    type: z.enum(['income', 'expense']),
    category: z.string().min(1, 'Category is required').max(100).trim(),
    date: z.string().datetime().optional(),
});

const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    type: z.enum(['income', 'expense', 'all']).optional().default('all'),
});

// Get Summary Stats & Transactions (paginated)
export const getFinanceOverview = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) return next(new AppError('User not authenticated', 401));

        const { page, limit, type } = paginationSchema.parse(req.query);
        const skip = (page - 1) * limit;

        const filter: Record<string, any> = { owner: userId };
        if (type !== 'all') filter.type = type;

        const [transactions, total, summary] = await Promise.all([
            Transaction.find(filter).sort({ date: -1 }).skip(skip).limit(limit).lean(),
            Transaction.countDocuments(filter),
            // Aggregate for summary stats (avoids loading all records)
            Transaction.aggregate([
                { $match: { owner: userId } },
                {
                    $group: {
                        _id: '$type',
                        total: { $sum: '$amount' },
                    },
                },
            ]),
        ]);

        const income = summary.find(s => s._id === 'income')?.total || 0;
        const expenses = summary.find(s => s._id === 'expense')?.total || 0;

        res.json({
            status: 'success',
            data: {
                summary: {
                    totalRevenue: income,
                    totalExpenses: expenses,
                    netProfit: income - expenses,
                },
                transactions,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// Add Transaction (Manual Entry — validated)
export const addTransaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) return next(new AppError('User not authenticated', 401));

        const data = transactionSchema.parse(req.body);

        const newTx = await Transaction.create({
            owner: userId,
            ...data,
            date: data.date ? new Date(data.date) : new Date(),
        });

        res.status(201).json({ status: 'success', data: newTx });
    } catch (error) {
        next(error);
    }
};
