import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import Transaction from '../models/Transaction';

// Get Summary Stats & Transactions
export const getFinanceOverview = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) return next(new Error('User not authenticated'));

        const transactions = await Transaction.find({ owner: userId }).sort({ date: -1 });

        const totalRevenue = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const netProfit = totalRevenue - totalExpenses;

        res.json({
            status: 'success',
            data: {
                summary: {
                    totalRevenue,
                    totalExpenses,
                    netProfit
                },
                transactions
            }
        });
    } catch (error) {
        next(error);
    }
};

// Add Transaction (Manual Entry)
export const addTransaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) return next(new Error('User not authenticated'));

        const { description, amount, type, category, date } = req.body;

        const newTx = await Transaction.create({
            owner: userId,
            description,
            amount,
            type,
            category,
            date: date || new Date()
        });

        res.status(201).json({ status: 'success', data: newTx });
    } catch (error) {
        next(error);
    }
};
