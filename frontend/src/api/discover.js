import { request } from './client'

const query = (params = {}) => {
  const p = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== '' && v != null) p.set(k, v)
  })
  const s = p.toString()
  return s ? `?${s}` : ''
}

export const discoverApi = {
  getPreferences: () => request('/discover/preferences'),
  savePreferences: (body) => request('/discover/preferences', { method: 'PUT', body }),
  capacity: () => request('/discover/capacity'),
  search: (q) => request(`/discover/search${query({ q })}`),
  stocks: (params) => request(`/discover/stocks${query(params)}`),
  ipos: (status) => request(`/discover/ipos${query({ status })}`), // active|open|upcoming|closed|listed|all
  // stock: { kind:'stock', symbol, amount }   ipo: { kind:'ipo', ipoId, lots }
  check: (body) => request('/discover/check', { method: 'POST', body }),
  history: () => request('/discover/history'),
}
