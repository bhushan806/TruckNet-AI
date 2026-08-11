import Transaction, { ITransaction } from '../models/Transaction';

export class FinanceService {
    static async getTransactions(
        userId: string,
        skip: number,
        limit: number,
        type: 'income' | 'expense' | 'all'
    ) {
        const filter: Record<string, any> = { owner: userId };
        if (type !== 'all') filter.type = type;

        const [transactions, total, summary] = await Promise.all([
            Transaction.find(filter).sort({ date: -1 }).skip(skip).limit(limit).lean(),
            Transaction.countDocuments(filter),
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

        const income = summary.find((s) => s._id === 'income')?.total || 0;
        const expenses = summary.find((s) => s._id === 'expense')?.total || 0;

        return {
            transactions,
            total,
            income,
            expenses,
        };
    }

    static async createTransaction(
        userId: string,
        data: {
            description: string;
            amount: number;
            type: 'income' | 'expense';
            category: string;
            date?: string;
        }
    ) {
        return Transaction.create({
            owner: userId,
            ...data,
            date: data.date ? new Date(data.date) : new Date(),
        });
    }
}
