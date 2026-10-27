import { request } from './client'

const query = (params = {}) => {
  const p = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== '' && v != null) p.set(k, v)
  })
  const s = p.toString()
  return s ? `?${s}` : ''
}

export const transactionsApi = {
  categories: () => request('/transactions/categories'),
  list: (params) => request(`/transactions${query(params)}`), // type, month, page, limit ...
  get: (id) => request(`/transactions/${id}`),
  create: (body) => request('/transactions', { method: 'POST', body }),
  bulk: (transactions) => request('/transactions/bulk', { method: 'POST', body: { transactions } }), // 1–50
  update: (id, body) => request(`/transactions/${id}`, { method: 'PUT', body }),
  remove: (id) => request(`/transactions/${id}`, { method: 'DELETE' }),
}
