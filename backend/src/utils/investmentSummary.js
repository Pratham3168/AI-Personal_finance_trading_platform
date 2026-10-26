// Combines the user's income/expenses (Transactions) with the investment ledger and profile.
// Pure function: the service fetches rows, this does the maths.
const { aggregate, monthRange, shiftMonth, monthsBetween, round2 } = require('./aggregate');
const { replay, entryCashEffect } = require('./ledger');

const CONCENTRATION_WARN_PCT = 40; // placeholder rule: flag if one holding is above this share of portfolio cost

function composeSummary({ profile, txRows, ledger: allLedger, month }) {
  const openingMonth = profile.openingCashMonth;
  const [, monthEnd] = monthRange(month);
  const ledger = allLedger.filter((e) => e.date <= monthEnd);
  const notes = [];

  const txByMonth = {};
  for (const r of txRows) {
    const m = r.date.slice(0, 7);
    (txByMonth[m] = txByMonth[m] || []).push(r);
  }
  const aggOf = (m) => (txByMonth[m] ? aggregate(txByMonth[m]) : null);
  const sum = (arr, f) => arr.reduce((s, x) => s + f(x), 0);

  // Cash at end of the month = opening cash + every month's income/expense cash flow + investment cash flow
  let cash = Number(profile.openingCash);
  for (const m of monthsBetween(openingMonth, month)) {
    const a = aggOf(m);
    const txCash = a ? a.totalIncome - a.totalExpenses - a.savingsOutflow : 0;
    const invCash = sum(ledger.filter((e) => e.date.slice(0, 7) === m), entryCashEffect);
    cash += txCash + invCash;
  }

  // Emergency fund target: months x average monthly consumption expenses (last 3 months that have data)
  const usedMonths = [shiftMonth(month, -2), shiftMonth(month, -1), month].filter((m) => txByMonth[m]);
  const avgExpenses = usedMonths.length ? sum(usedMonths, (m) => aggOf(m).totalExpenses) / usedMonths.length : 0;
  const target = profile.emergencyFundMonths * avgExpenses;
  const safeRoom = Math.max(0, cash - target);
  const shortfall = Math.max(0, target - cash);

  // This month's income and expenses
  const cur = aggOf(month) || { totalIncome: 0, totalExpenses: 0, savings: 0, savingsRatePct: null, savingsOutflow: 0 };

  // This month's investment activity
  const inMonth = ledger.filter((e) => e.date.slice(0, 7) === month);
  const buys = inMonth.filter((e) => e.type === 'buy');
  const sells = inMonth.filter((e) => e.type === 'sell');
  const divs = inMonth.filter((e) => e.type === 'dividend');
  const boughtAmount = sum(buys, (e) => e.amount);
  const buyFees = sum(buys, (e) => e.fees);
  const sellFees = sum(sells, (e) => e.fees);
  const soldNet = sum(sells, (e) => e.amount) - sellFees;
  const dividends = sum(divs, (e) => e.amount);

  // Holdings as of month end
  const { positions, realizedEvents, errors } = replay(ledger);
  errors.forEach((e) => notes.push(`Ledger problem: ${e}`));
  const realizedInMonth = sum(realizedEvents.filter((ev) => ev.date.slice(0, 7) === month), (ev) => ev.realized);
  const open = Object.values(positions).filter((p) => p.quantity > 0);
  const costBasisTotal = sum(open, (p) => p.totalCost);
  let largest = null;
  for (const p of open) if (!largest || p.totalCost > largest.totalCost) largest = p;
  const largestPct = largest && costBasisTotal > 0 ? (largest.totalCost / costBasisTotal) * 100 : null;
  const netWorthAtCost = cash + costBasisTotal;

  // Notes (facts only)
  if (usedMonths.length === 0) notes.push('No income/expense data found in the last 3 months, so the emergency-fund target is 0.');
  if (cash < 0) notes.push('Calculated cash is negative. Check the opening cash or look for missing entries.');
  if (shortfall > 0) notes.push(`Cash is below the emergency-fund target by ${round2(shortfall)}.`);
  if (largestPct !== null && largestPct > CONCENTRATION_WARN_PCT) {
    notes.push(`${largest.symbol} is ${round2(largestPct)}% of your portfolio cost (flag level: ${CONCENTRATION_WARN_PCT}%).`);
  }
  if (ledger.some((e) => e.date.slice(0, 7) < openingMonth)) {
    notes.push('Some investment entries are dated before your opening cash month. They count in holdings but not in cash.');
  }
  notes.push('Portfolio values are at cost. Live market prices are not included yet.');

  return {
    month,
    incomeAndExpenses: {
      totalIncome: round2(cur.totalIncome),
      consumptionExpenses: round2(cur.totalExpenses),
      leftFromIncome: round2(cur.savings),
      savingsRatePct: cur.savingsRatePct,
      otherSavingsOutflow: round2(cur.savingsOutflow),
    },
    investments: {
      boughtAmount: round2(boughtAmount),
      buyFees: round2(buyFees),
      soldProceedsNet: round2(soldNet),
      sellFees: round2(sellFees),
      dividendsReceived: round2(dividends),
      realizedGainInMonth: round2(realizedInMonth),
      netCashToInvestments: round2(boughtAmount + buyFees - soldNet - dividends),
    },
    cash: {
      openingCash: round2(Number(profile.openingCash)),
      openingCashMonth: openingMonth,
      cashAtMonthEnd: round2(cash),
    },
    emergencyFund: {
      months: profile.emergencyFundMonths,
      averageMonthlyExpenses: round2(avgExpenses),
      expenseMonthsUsed: usedMonths,
      target: round2(target),
      safeToInvestRoom: round2(safeRoom),
      shortfall: round2(shortfall),
    },
    portfolio: {
      holdingsCount: open.length,
      costBasisTotal: round2(costBasisTotal),
      largestHolding: largest ? { symbol: largest.symbol, pctOfPortfolioCost: round2(largestPct) } : null,
      concentrationWarning: largestPct !== null && largestPct > CONCENTRATION_WARN_PCT,
      netWorthAtCost: round2(netWorthAtCost),
      investedPctOfNetWorth: netWorthAtCost > 0 ? round2((costBasisTotal / netWorthAtCost) * 100) : null,
    },
    notes,
  };
}

module.exports = { composeSummary, CONCENTRATION_WARN_PCT };
