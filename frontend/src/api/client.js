import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshing = null
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry && localStorage.getItem('refresh')) {
      original._retry = true
      refreshing = refreshing || axios.post('/api/auth/token/refresh/', {
        refresh: localStorage.getItem('refresh'),
      }).then((r) => {
        localStorage.setItem('access', r.data.access)
        if (r.data.refresh) localStorage.setItem('refresh', r.data.refresh)
        return r.data.access
      }).finally(() => { refreshing = null })
      try {
        const access = await refreshing
        original.headers.Authorization = `Bearer ${access}`
        return api(original)
      } catch {
        localStorage.clear(); window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)
export default api
