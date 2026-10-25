const asyncHandler = require('../utils/asyncHandler');
const { getMonthSummary } = require('../services/summaryService');
const { analyseSpending } = require('../services/aiService');
const { previousMonth, currentMonth } = require('../utils/aggregate');

const httpError = (status, message) => Object.assign(new Error(message), { status });

// GET /api/analysis/summary?month=YYYY-MM   (no AI, free: shows the figures that would be analysed)
exports.summary = asyncHandler(async (req, res) => {
  const month = req.query.month || currentMonth();
  const summary = await getMonthSummary(req.user.id, month);
  if (!summary) throw httpError(404, `No transactions found for ${month}`);
  res.json({ success: true, data: { summary } });
});

// POST /api/analysis/spending   body (optional): { "month": "2026-10" }
exports.analyseSpending = asyncHandler(async (req, res) => {
  const month = req.body.month || currentMonth();

  const current = await getMonthSummary(req.user.id, month);
  if (!current) throw httpError(404, `No transactions found for ${month}. Add some data first.`);

  const prevMonth = previousMonth(month);
  const prev = await getMonthSummary(req.user.id, prevMonth);

  // Only figures are sent to OpenAI. No name, email, phone or transaction descriptions.
  const payload = {
    currency: process.env.CURRENCY || 'INR',
    month,
    currentMonth: current,
    previousMonth: prev
      ? {
          month: prevMonth,
          totalIncome: prev.totalIncome,
          totalExpenses: prev.totalExpenses,
          savings: prev.savings,
          savingsRatePct: prev.savingsRatePct,
          expensesByCategory: prev.expensesByCategory.map(({ category, amount }) => ({ category, amount })),
        }
      : null,
  };

  const { analysis, model, usage } = await analyseSpending(payload);

  res.json({
    success: true,
    data: { month, summary: current, previousMonthCompared: prev ? prevMonth : null, analysis, meta: { model, usage } },
  });
});
