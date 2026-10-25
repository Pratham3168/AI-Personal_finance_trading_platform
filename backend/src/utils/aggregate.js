// Pure functions (no database, no AI). All money maths happens here, in code.
// The AI only receives these results and explains them.

const round2 = (n) => Math.round(n * 100) / 100;

function monthRange(month) {
  const [y, m] = month.split('-').map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return [`${month}-01`, `${month}-${String(last).padStart(2, '0')}`];
}

function previousMonth(month) {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

const currentMonth = () => new Date().toISOString().slice(0, 7);

/**
 * rows = transactions of ONE user for ONE month.
 * Double-count rule: if a category has a monthly total AND daily entries,
 * the monthly total is used and the daily entries are ignored for that category.
 */
function aggregate(rows) {
  const groups = {};
  for (const r of rows) {
    const key = `${r.type}|${r.category}`;
    const g = (groups[key] = groups[key] || { type: r.type, category: r.category, monthlyTotal: null, dailySum: 0 });
    const amt = Number(r.amount);
    if (r.entryType === 'monthly') g.monthlyTotal = (g.monthlyTotal || 0) + amt;
    else g.dailySum += amt;
  }

  const notes = [];
  const income = [];
  const expense = [];
  for (const g of Object.values(groups)) {
    const useMonthly = g.monthlyTotal !== null;
    if (useMonthly && g.dailySum > 0) {
      notes.push(`For ${g.type} "${g.category}" both a monthly total and daily entries exist; the monthly total was used to avoid double counting.`);
    }
    const item = { category: g.category, amount: round2(useMonthly ? g.monthlyTotal : g.dailySum), source: useMonthly ? 'monthly_total' : 'daily_entries' };
    (g.type === 'income' ? income : expense).push(item);
  }
  income.sort((a, b) => b.amount - a.amount);
  expense.sort((a, b) => b.amount - a.amount);

  const totalIncome = round2(income.reduce((s, x) => s + x.amount, 0));
  const totalExpenses = round2(expense.reduce((s, x) => s + x.amount, 0));
  const savings = round2(totalIncome - totalExpenses);

  // Extra detail from daily expense entries only
  // (skip categories where a monthly total was used, so ignored entries never leak into these stats)
  const monthlyExpenseCats = new Set(expense.filter((e) => e.source === 'monthly_total').map((e) => e.category));
  const dailyExpenses = rows.filter(
    (r) => r.type === 'expense' && r.entryType === 'daily' && !monthlyExpenseCats.has(r.category)
  );
  const spendByPaymentMethod = {};
  for (const r of dailyExpenses) {
    const k = r.paymentMethod || 'not_specified';
    spendByPaymentMethod[k] = round2((spendByPaymentMethod[k] || 0) + Number(r.amount));
  }
  const largestExpenses = [...dailyExpenses]
    .sort((a, b) => Number(b.amount) - Number(a.amount))
    .slice(0, 5)
    .map((r) => ({ date: r.date, category: r.category, amount: round2(Number(r.amount)) }));

  return {
    totalIncome,
    totalExpenses,
    savings,
    savingsRatePct: totalIncome > 0 ? round2((savings / totalIncome) * 100) : null,
    expensesByCategory: expense.map((e) => ({
      ...e,
      pctOfExpenses: totalExpenses > 0 ? round2((e.amount / totalExpenses) * 100) : 0,
    })),
    incomeBySource: income,
    spendByPaymentMethod,
    largestExpenses,
    entryCounts: {
      daily: rows.filter((r) => r.entryType === 'daily').length,
      monthlyTotals: rows.filter((r) => r.entryType === 'monthly').length,
    },
    notes,
  };
}

module.exports = { aggregate, monthRange, previousMonth, currentMonth, round2 };
