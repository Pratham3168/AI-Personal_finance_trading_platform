import { request } from './client'

export const analysisApi = {
  summary: (month) => request(`/analysis/summary?month=${month}`),
  spending: (month) => request('/analysis/spending', { method: 'POST', body: { month } }),
}
