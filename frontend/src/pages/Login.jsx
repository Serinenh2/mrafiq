import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { t, lang, setLang, theme, setTheme } = useApp()
  const { login } = useAuth()
  const nav = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true); setError('')
    try { await login(form.username, form.password); nav('/') }
    catch (err) {
      const detail = err.response?.data?.detail
      // Le message de verrouillage (§26) est déjà en français ; le message par défaut
      // de SimpleJWT est en anglais et doit rester traduit via t('loginError').
      setError(detail && detail !== 'No active account found with the given credentials'
        ? detail : t('loginError'))
    } finally { setBusy(false) }
  }

  return (
    <div className="min-h-screen grid place-items-center p-6"
         style={{ background: 'var(--bg-sidebar)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-6 text-ink-ondark">
          <div className="text-5xl font-bold" style={{ fontFamily: 'var(--font-arabic)' }}>مرافق</div>
          <div className="text-sm font-semibold tracking-[.4em] mt-1"
               style={{ color: 'var(--brand-brass-300)' }}>MRAFIQ</div>
          <p className="text-xs mt-3" style={{ color: '#8FA3C0' }}>{t('slogan')}</p>
        </div>
        <div className="card">
          <label className="flabel">{t('username')}</label>
          <input className="input mb-4" value={form.username} autoFocus
                 onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <label className="flabel">{t('password')}</label>
          <input className="input mb-4" type="password" value={form.password}
                 onKeyDown={(e) => e.key === 'Enter' && submit()}
                 onChange={(e) => setForm({ ...form, password: e.target.value })} />
          {error && <p className="text-sm mb-3" style={{ color: 'var(--status-nonconforme)' }}>{error}</p>}
          <button className="btn-primary w-full justify-center" disabled={busy} onClick={submit}>
            {t('login')}
          </button>
        </div>
        <div className="flex justify-center gap-2 mt-4">
          <button className="btn-sm text-xs font-semibold rounded-pill px-3 py-1"
                  style={{ color: '#B9C7DB', border: '1px solid #2B3B57', background: 'transparent' }}
                  onClick={() => setLang(lang === 'fr' ? 'ar' : 'fr')}>AR | FR</button>
          <button className="btn-sm text-xs font-semibold rounded-pill px-3 py-1"
                  style={{ color: '#B9C7DB', border: '1px solid #2B3B57', background: 'transparent' }}
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? t('light') : t('dark')}</button>
        </div>
      </div>
    </div>
  )
}
