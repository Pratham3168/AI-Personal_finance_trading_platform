import { request } from './client'

const query = (params = {}) => {
  const p = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== '' && v != null) p.set(k, v)
  })
  const s = p.toString()
  return s ? `?${s}` : ''
}

export const investmentsApi = {
  getProfile: () => request('/investments/profile'), // 404 when no profile yet
  saveProfile: (body) => request('/investments/profile', { method: 'PUT', body }),
  addEntry: (body) => request('/investments/transactions', { method: 'POST', body }),
  listEntries: (params) => request(`/investments/transactions${query(params)}`), // symbol, type, month, page, limit
  deleteEntry: (id) => request(`/investments/transactions/${id}`, { method: 'DELETE' }),
  holdings: () => request('/investments/holdings'),
  summary: (month) => request(`/investments/summary${query({ month })}`),
}
