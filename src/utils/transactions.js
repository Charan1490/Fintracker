import { format, parseISO, startOfMonth } from 'date-fns';

// Get totals for dashboard cards
export const getTotals = (transactions) => {
  return transactions.reduce(
    (acc, t) => {
      if (t.amount > 0) acc.income += t.amount;
      else acc.expenses += Math.abs(t.amount);
      return acc;
    },
    { income: 0, expenses: 0 }
  );
};

// Process data for category pie chart
export const getCategoryData = (transactions) => {
  const categoryMap = transactions.reduce((acc, t) => {
    const key = t.category;
    const amount = Math.abs(t.amount);
    acc[key] = (acc[key] || 0) + amount;
    return acc;
  }, {});

  return Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value: Number(value.toFixed(2)),
  }));
};

// Process data for monthly trend line chart
export const getMonthlyTrendData = (transactions) => {
  const monthlyData = transactions.reduce((acc, t) => {
    const monthStart = startOfMonth(parseISO(t.date)).toISOString();
    acc[monthStart] = acc[monthStart] || { income: 0, expenses: 0 };
    
    if (t.amount > 0) {
      acc[monthStart].income += t.amount;
    } else {
      acc[monthStart].expenses += Math.abs(t.amount);
    }
    return acc;
  }, {});

  return Object.entries(monthlyData).map(([date, values]) => ({
    date: format(parseISO(date), 'MMM yyyy'),
    ...values,
  })).sort((a, b) => parseISO(a.date) - parseISO(b.date));
};