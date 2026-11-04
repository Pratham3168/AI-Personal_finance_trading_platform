import { useTheme } from '../../context/ThemeContext'

export const PALETTE = {
  light: { income: '#047857', expense: '#1d4ed8', axis: '#5f7391', grid: 'rgba(10,40,90,0.10)', donut: ['#1d4ed8', '#0e7490', '#6366f1', '#0d9488', '#8b5cf6', '#94a3b8'] },
  dark: { income: '#34d399', expense: '#4f8dff', axis: '#8798b8', grid: 'rgba(150,180,255,0.14)', donut: ['#4f8dff', '#22d3ee', '#818cf8', '#2dd4bf', '#a78bfa', '#64748b'] },
}
export const usePalette = () => PALETTE[useTheme().resolved === 'dark' ? 'dark' : 'light']
