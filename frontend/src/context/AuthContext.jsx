import { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios'
import api from '../api/client'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('access')) { setReady(true); return }
    api.get('/auth/me/')
      .then((r) => setUser(r.data))
      .catch(() => localStorage.clear())
      .finally(() => setReady(true))
  }, [])

  const login = async (username, password) => {
    const r = await axios.post('/api/auth/token/', { username, password })
    localStorage.setItem('access', r.data.access)
    localStorage.setItem('refresh', r.data.refresh)
    const me = await api.get('/auth/me/')
    setUser(me.data)
  }
  const logout = () => { localStorage.clear(); setUser(null) }

  return <AuthCtx.Provider value={{ user, ready, login, logout }}>{children}</AuthCtx.Provider>
}
export const useAuth = () => useContext(AuthCtx)
