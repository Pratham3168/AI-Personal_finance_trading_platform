import { CURRENCY } from '../config'

export const formatMoney = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: CURRENCY, maximumFractionDigits: 2 }).format(
    Number(n) || 0
  )

const LABELS = { emi_loan: 'EMI / Loan', gifts_donations: 'Gifts & donations', savings_investments: 'Savings & investments', upi: 'UPI' }

// "personal_care" -> "Personal care", "totalIncome" -> "Total income"
export const prettify = (s) => {
  if (LABELS[s]) return LABELS[s]
  const t = String(s).replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()
  return t.charAt(0).toUpperCase() + t.slice(1)
}

// Local-time YYYY-MM-DD and YYYY-MM
export const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)
export const currentMonth = () => today().slice(0, 7)

export const formatDate = (iso) => {
  const [y, m, d] = String(iso).split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const formatMonth = (ym) => {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}
