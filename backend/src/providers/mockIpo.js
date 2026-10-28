// SAMPLE DATA ONLY. All companies are fictional.
const day = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
const SRC = 'MOCK sample data (fictional IPOs, not real)';

const mk = (id, name, type, status, industry, o, c, a, l, low, high, lot, size, sub, registrar) => ({
  id, name, type, status, industry, openDate: day(o), closeDate: day(c), allotmentDate: day(a), listingDate: day(l),
  priceBandLow: low, priceBandHigh: high, lotSize: lot, minAmount: high * lot, issueSizeCr: size,
  subscription: sub ? { ...sub, asOf: day(0) } : null, registrar, asOf: day(0), dataSource: SRC,
});

const ipos = [
  mk('solarnest-energy-ipo', 'SolarNest Energy Ltd', 'mainboard', 'open', 'Energy', -1, 1, 4, 6, 285, 300, 50, 650, { qib: 2.1, nii: 1.4, retail: 0.9, total: 1.5 }, 'Sample Registrar'),
  mk('medibridge-labs-ipo', 'MediBridge Labs Ltd', 'mainboard', 'upcoming', 'Healthcare', 5, 7, 10, 12, 420, 440, 34, 900, null, 'Sample Registrar'),
  mk('techvista-sme-ipo', 'TechVista Solutions Ltd', 'sme', 'open', 'IT', -1, 2, 5, 7, 118, 125, 1000, 45, { qib: 0, nii: 3.2, retail: 2.1, total: 2.4 }, 'Sample Registrar'),
  mk('agrofresh-ipo', 'AgroFresh Foods Ltd', 'mainboard', 'closed', 'FMCG', -6, -4, -1, 1, 95, 100, 150, 300, { qib: 8.5, nii: 6.2, retail: 3.9, total: 6.1 }, 'Sample Registrar'),
];

exports.listIpos = async () => ipos;
exports.getIpo = async (id) => ipos.find((i) => i.id === id) || null;
