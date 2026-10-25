// Pure functions (no database). Holdings, cost basis and realized gains are calculated here.
// Method: AVERAGE COST. Buy fees are added to cost. Sell fees reduce sale proceeds.

const round2 = (n) => Math.round(n * 100) / 100;
const TYPE_ORDER = { buy: 0, sell: 1, dividend: 2 };

const sortEntries = (entries) =>
  [...entries].sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      TYPE_ORDER[a.type] - TYPE_ORDER[b.type] ||
      new Date(a.createdAt) - new Date(b.createdAt)
  );

// Effect of one entry on the user's cash
const entryCashEffect = (e) => {
  if (e.type === 'buy') return -(e.amount + e.fees);
  if (e.type === 'sell') return e.amount - e.fees;
  return e.amount; // dividend
};

// Replays the ledger in date order. Returns positions, realized events and any rule violations.
function replay(entries) {
  const positions = {};
  const realizedEvents = [];
  const errors = [];

  for (const e of sortEntries(entries)) {
    const key = `${e.symbol}|${e.exchange}`;
    const p = (positions[key] = positions[key] || {
      symbol: e.symbol, exchange: e.exchange, companyName: null,
      quantity: 0, totalCost: 0, realizedGain: 0, dividends: 0, fees: 0, hasBuy: false,
    });
    if (e.companyName) p.companyName = e.companyName;

    if (e.type === 'buy') {
      p.quantity += e.quantity;
      p.totalCost += e.amount + e.fees;
      p.fees += e.fees;
      p.hasBuy = true;
    } else if (e.type === 'sell') {
      if (e.quantity > p.quantity) {
        errors.push(`Cannot sell ${e.quantity} ${e.symbol} on ${e.date}: only ${p.quantity} held at that point.`);
        continue;
      }
      const costRemoved = (p.totalCost * e.quantity) / p.quantity;
      const proceeds = e.amount - e.fees;
      const realized = proceeds - costRemoved;
      p.realizedGain += realized;
      p.quantity -= e.quantity;
      p.totalCost = p.quantity === 0 ? 0 : p.totalCost - costRemoved;
      p.fees += e.fees;
      realizedEvents.push({ date: e.date, symbol: e.symbol, exchange: e.exchange, realized });
    } else {
      if (!p.hasBuy) {
        errors.push(`Dividend for ${e.symbol} on ${e.date} has no earlier purchase.`);
        continue;
      }
      p.dividends += e.amount;
    }
  }
  return { positions, realizedEvents, errors };
}

function summarisePositions(positions) {
  const all = Object.values(positions);
  const open = all.filter((p) => p.quantity > 0);
  const costBasisTotal = open.reduce((s, p) => s + p.totalCost, 0);

  const fmt = (p) => ({
    symbol: p.symbol,
    exchange: p.exchange,
    companyName: p.companyName,
    quantity: p.quantity,
    averageCost: p.quantity > 0 ? round2(p.totalCost / p.quantity) : 0,
    totalCost: round2(p.totalCost),
    pctOfPortfolioCost: p.quantity > 0 && costBasisTotal > 0 ? round2((p.totalCost / costBasisTotal) * 100) : 0,
    realizedGain: round2(p.realizedGain),
    dividends: round2(p.dividends),
    fees: round2(p.fees),
  });

  return {
    holdings: open.map(fmt).sort((a, b) => b.totalCost - a.totalCost),
    closedPositions: all.filter((p) => p.quantity === 0).map(fmt),
    totals: {
      costBasisTotal: round2(costBasisTotal),
      realizedGainTotal: round2(all.reduce((s, p) => s + p.realizedGain, 0)),
      dividendsTotal: round2(all.reduce((s, p) => s + p.dividends, 0)),
      feesTotal: round2(all.reduce((s, p) => s + p.fees, 0)),
    },
  };
}

module.exports = { replay, summarisePositions, entryCashEffect, sortEntries };
