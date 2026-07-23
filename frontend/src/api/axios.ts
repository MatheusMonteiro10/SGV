import axios from 'axios'

const TOKEN_KEY = 'sgv:token'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// O interceptor não conhece o AuthContext — apenas avisa via evento.
// Quem decide o que fazer com uma sessão expirada é o AuthProvider.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new Event('sgv:unauthorized'))
    }
    return Promise.reject(error)
  },
)

export default api
export { TOKEN_KEY }