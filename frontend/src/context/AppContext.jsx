import { createContext, useContext, useEffect, useState } from 'react'
import fr from '../i18n/fr'
import ar from '../i18n/ar'

const dicts = { fr, ar }
const AppCtx = createContext(null)

export function AppProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'fr')
  const [theme, setTheme] = useState(
    localStorage.getItem('theme') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('theme', theme)
  }, [theme])
  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    localStorage.setItem('lang', lang)
  }, [lang])

  // t('a.b.c') — traduction centralisée, aucun texte en dur dans les composants (§6)
  const t = (path) => path.split('.').reduce((o, k) => (o ? o[k] : undefined), dicts[lang]) ?? path
  const L = (obj, frKey = 'label_fr', arKey = 'label_ar') =>
    (lang === 'ar' && obj?.[arKey]) ? obj[arKey] : obj?.[frKey]

  return (
    <AppCtx.Provider value={{ lang, setLang, theme, setTheme, t, L }}>
      {children}
    </AppCtx.Provider>
  )
}
export const useApp = () => useContext(AppCtx)
