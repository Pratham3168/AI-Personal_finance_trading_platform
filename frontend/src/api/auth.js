import { request } from './client'

export const authApi = {
  signup: (payload) => request('/auth/signup', { method: 'POST', body: payload }),
  verifyOtp: (email, otp) => request('/auth/verify-otp', { method: 'POST', body: { email, otp } }),
  resendOtp: (email) => request('/auth/resend-otp', { method: 'POST', body: { email } }),
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
}
