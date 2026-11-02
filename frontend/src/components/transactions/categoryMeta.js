import {
  Award, Briefcase, Bus, Clapperboard, Ellipsis, Fuel, GraduationCap, Gift, HeartPulse, House, KeyRound, Landmark,
  Laptop, PiggyBank, Plane, Repeat, ShieldCheck, ShoppingBag, ShoppingBasket, Sparkles, Store, Tag, TrendingUp, Utensils, Zap,
} from 'lucide-react'
import { CURRENCY } from '../../config'
import { prettify } from '../../utils/format'

// Icon per category. Unknown categories fall back to a generic tag.
const ICONS = {
  // expenses
  food: Utensils, groceries: ShoppingBasket, rent: House, utilities: Zap, transport: Bus, fuel: Fuel,
  shopping: ShoppingBag, health: HeartPulse, education: GraduationCap, entertainment: Clapperboard, travel: Plane,
  emi_loan: Landmark, insurance: ShieldCheck, subscriptions: Repeat, personal_care: Sparkles, gifts_donations: Gift,
  savings_investments: PiggyBank, other: Ellipsis,
  // income
  salary: Briefcase, business: Store, freelance: Laptop, rental: KeyRound, investments: TrendingUp, bonus: Award, gifts: Gift,
}
export const categoryIcon = (key) => ICONS[key] || Tag

const LABELS = { netbanking: 'Net banking', upi: 'UPI', emi_loan: 'EMI / Loan', gifts_donations: 'Gifts & donations', savings_investments: 'Savings & investments' }
export const labelOf = (key) => LABELS[key] || prettify(key)

// Backend may name the groups `expense` or `expenses`
export function categoriesFor(options, type) {
  const c = options?.categories
  return c?.[type] ?? c?.[`${type}s`] ?? options?.[type] ?? options?.[`${type}s`] ?? []
}

export const CURRENCY_SYMBOL =
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: CURRENCY }).formatToParts(0).find((p) => p.type === 'currency')?.value || '₹'

// "Today", "Yesterday", or "Mon, 20 Oct 2026"
export function dayLabel(iso, todayIso) {
  const [y, mo, d] = iso.split('-').map(Number)
  const date = new Date(y, mo - 1, d)
  const t = new Date(...todayIso.split('-').map((v, i) => (i === 1 ? Number(v) - 1 : Number(v))))
  const diff = Math.round((t - date) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return date.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
}

export const shiftDate = (iso, days) => {
  const [y, m, d] = iso.split('-').map(Number)
  const x = new Date(y, m - 1, d + days)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}
