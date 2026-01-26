import Transaction from '../models/transaction.model.js';

export const getRevenueReport = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get successful and verified transactions
    const transactions = await Transaction.find({
      status: 'successful',
      verified: true
    }).sort({ createdAt: 1 });

    // Calculate totals
    const totals = {
      daily: { local: 0, international: 0 },
      weekly: { local: 0, international: 0 },
      yearly: { local: 0, international: 0 }
    };

    // Time series data for charts
    const chartData = {
      daily: [],
      monthly: [],
      yearly: []
    };

    // Process transactions
    transactions.forEach(transaction => {
      const amount = transaction.paymentProvider === 'Paystack' 
        ? transaction.originalAmount || transaction.amount
        : transaction.convertedAmount || transaction.amount;
      
      const isLocal = transaction.paymentProvider === 'Paystack';
      const date = new Date(transaction.createdAt);

      // Daily totals
      if (date >= startOfDay) {
        totals.daily[isLocal ? 'local' : 'international'] += amount;
      }

      // Weekly totals
      if (date >= startOfWeek) {
        totals.weekly[isLocal ? 'local' : 'international'] += amount;
      }

      // Yearly totals
      if (date >= startOfYear) {
        totals.yearly[isLocal ? 'local' : 'international'] += amount;
      }
    });

    // Generate chart data (last 7 days, 12 months, 3 years)
    const dailyData = generateDailyData(transactions);
    const monthlyData = generateMonthlyData(transactions);
    const yearlyData = generateYearlyData(transactions);

    res.status(200).json({
      success: true,
      data: {
        totals,
        charts: {
          daily: dailyData,
          monthly: monthlyData,
          yearly: yearlyData
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const generateDailyData = (transactions) => {
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const dayTransactions = transactions.filter(t => 
      new Date(t.createdAt) >= dayStart && new Date(t.createdAt) < dayEnd
    );

    const local = dayTransactions
      .filter(t => t.paymentProvider === 'Paystack')
      .reduce((sum, t) => sum + (t.originalAmount || t.amount), 0);

    const international = dayTransactions
      .filter(t => t.paymentProvider === 'Flutterwave')
      .reduce((sum, t) => sum + (t.convertedAmount || t.amount), 0);

    data.push({
      date: date.toISOString().split('T')[0],
      local,
      international
    });
  }
  return data;
};

const generateMonthlyData = (transactions) => {
  const data = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 1);

    const monthTransactions = transactions.filter(t => 
      new Date(t.createdAt) >= monthStart && new Date(t.createdAt) < monthEnd
    );

    const local = monthTransactions
      .filter(t => t.paymentProvider === 'Paystack')
      .reduce((sum, t) => sum + (t.originalAmount || t.amount), 0);

    const international = monthTransactions
      .filter(t => t.paymentProvider === 'Flutterwave')
      .reduce((sum, t) => sum + (t.convertedAmount || t.amount), 0);

    data.push({
      month: date.toISOString().slice(0, 7),
      local,
      international
    });
  }
  return data;
};

const generateYearlyData = (transactions) => {
  const data = [];
  for (let i = 2; i >= 0; i--) {
    const year = new Date().getFullYear() - i;
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year + 1, 0, 1);

    const yearTransactions = transactions.filter(t => 
      new Date(t.createdAt) >= yearStart && new Date(t.createdAt) < yearEnd
    );

    const local = yearTransactions
      .filter(t => t.paymentProvider === 'Paystack')
      .reduce((sum, t) => sum + (t.originalAmount || t.amount), 0);

    const international = yearTransactions
      .filter(t => t.paymentProvider === 'Flutterwave')
      .reduce((sum, t) => sum + (t.convertedAmount || t.amount), 0);

    data.push({
      year,
      local,
      international
    });
  }
  return data;
};